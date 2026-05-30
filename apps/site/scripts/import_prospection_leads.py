#!/usr/bin/env python3
"""
Import Script for Prospection CSV Leads into BarbetZap CRM

Imports leads from prospecting CSV(s) into Supabase CRM with proper tracking.

Usage:
    python scripts/import_prospection_leads.py

Output:
    - Imports all leads to Supabase crm_leads table
    - Sets all leads to funnel_stage='new'
    - Creates detailed report of import

Author: BarbetZap System
Date: 2026-02-23
"""

import csv
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from barberzap_python.crm.crm_manager import upsert_lead
from barberzap_python.integrations.supabase_rest import get_client

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==========================================
# CONSTANTS & CONFIGURATION
# ==========================================

# Tenant ID especial para prospecção outbound
DEFAULT_TENANT_ID = 'prospection'

# Fonte de lead
LEAD_SOURCE = 'prospection_csv'

# CSV paths to process
CSV_PATHS = [
    '/root/Barberzap SITE/data/Prospecção de Leads - sheet1.csv',
    '/root/Barberzap SITE/data/lista_prospeccao_limpa.csv',
]

# Mapping de estágios do funil
FUNNEL_STAGES = [
    'new',
    'contacted',
    'responded',
    'interested',
    'demo_requested',
    'demo_scheduled',
    'considering',
    'customer',
    'active',
    'not_interested',
    'unresponsive',
    'failed',
    'lost'
]

# City normalization (optional - standardize city names)
CITY_NORMALIZATION = {
    'itajai': 'Itajaí',
    'blumenau': 'Blumenau',
}

# ==========================================
# UTILITY FUNCTIONS
# ==========================================

def normalize_phone(phone: str) -> str:
    """
    Normaliza número de telefone: remove espaços, +, -, (, )

    Args:
        phone: Raw phone number

    Returns:
        Normalized phone string (starts with 55, digits only)
    """
    if not phone:
        return ''

    # Remove all non-numeric characters
    phone = ''.join(c for c in phone if c.isdigit())

    # If phone starts with other than 55, add 55 (Brazil country code)
    if phone and len(phone) == 10 or len(phone) == 11:
        phone = '55' + phone

    return phone


def normalize_city(city: str) -> str:
    """
    Normaliza nome da cidade (primeira letra maiúscula)

    Args:
        city: City name

    Returns:
        Normalized city name
    """
    if not city:
        return ''

    city = city.strip().lower()

    # Lookup in normalization map
    if city in CITY_NORMALIZATION:
        city = CITY_NORMALIZATION[city]

    # Capitalize first letter
    return city.capitalize()


def get_phone_from_format(phone_str: str) -> str:
    """
    Extrai número de telefone de diferentes formatos:
    - +55 47 3311-4288
    - (47) 3311-4288
    - 4733114288
    - etc.

    Args:
        phone_str: Phone string in any format

    Returns:
        Normalized phone number (digits only, starts with 55)
    """
    if not phone_str:
        return ''

    # Remove all non-digit characters
    phone = ''.join(c for c in phone_str if c.isdigit())

    # Validate length
    if len(phone) < 10:
        logger.warning(f"Phone too short: {phone_str} -> {phone}")
        return ''

    # Add Brazil country code if missing
    if len(phone) == 10 or len(phone) == 11:
        phone = '55' + phone

    return phone


# ==========================================
# CSV READING FUNCTIONS
# ==========================================

def read_csv_prospection(csv_path: str) -> List[Dict[str, Any]]:
    """
    Lê CSV de prospecção e retorna lista de leads.

    Supports two CSV formats:
    Format 1: Telefone,Cidade,Bairro,Nome,Website,E-mail,E-mail2
    Format 2: Nome,Telefone,Cidade,Bairro

    Args:
        csv_path: Path to CSV file

    Returns:
        List of lead dictionaries
    """
    leads = []
    duplicate_phones = set()

    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            # Detect delimiter
            dialect = csv.Sniffer().sniff(f.read(1024))
            f.seek(0)

            reader = csv.DictReader(f, dialect=dialect)

            logger.info(f"Reading CSV: {csv_path}")
            logger.info(f"CSV columns: {reader.fieldnames}")

            for row in reader:
                # Extract phone (try different column names)
                phone_raw = (
                    row.get('Telefone', '') or
                    row.get('Telefone ', '') or
                    row.get('phone', '') or
                    row.get('Phone', '') or
                    ''
                )

                # Normalize phone
                phone = normalize_phone(phone_raw)

                if not phone or len(phone) < 12:
                    logger.debug(f"Skipping invalid phone: {phone_raw} (row {reader.line_num})")
                    continue

                # Skip duplicates within this batch
                if phone in duplicate_phones:
                    logger.debug(f"Skipping duplicate phone in same file: {phone}")
                    continue
                duplicate_phones.add(phone)

                # Extract name (try different column names)
                name = (
                    row.get('Nome', '') or
                    row.get('nome', '') or
                    row.get('Name', '') or
                    ''
                ).strip()

                # Normalize city
                city_raw = (
                    row.get('Cidade', '') or
                    row.get('cidade', '') or
                    row.get('City', '') or
                    ''
                ).strip()
                city = normalize_city(city_raw)

                # Extract neighborhood
                neighborhood = (
                    row.get('Bairro', '') or
                    row.get('bairro', '') or
                    row.get('neighborhood', '') or
                    ''
                ).strip()

                # Extract emails
                email = (
                    row.get('E-mail', '') or
                    row.get('E-mail2', '') or
                    row.get('email', '') or
                    row.get('Email', '') or
                    ''
                ).strip() or None

                # Extract website (optional)
                website = (
                    row.get('Website', '') or
                    row.get('website', '') or
                    ''
                ).strip() or None

                # Create lead dictionary
                lead = {
                    'phone': phone,
                    'name': name if name else None,  # Use None if empty
                    'email': email,
                    'city': city if city else None,
                    'neighborhood': neighborhood if neighborhood else None,
                    'website': website,
                    'source_file': Path(csv_path).name,
                }

                leads.append(lead)

        logger.info(f"✅ Read {len(leads)} valid leads from: {csv_path}")
        return leads

    except FileNotFoundError:
        logger.error(f"❌ File not found: {csv_path}")
        return []
    except Exception as e:
        logger.error(f"❌ Error reading CSV {csv_path}: {e}", exc_info=True)
        return []


def read_all_csvs(paths: List[str]) -> List[Dict[str, Any]]:
    """
    Lê múltiplos CSVs e combina, removendo duplicatas

    Args:
        paths: List of CSV file paths

    Returns:
        Combined list of unique leads
    """
    all_leads = []
    seen_phones = set()

    for csv_path in paths:
        if not Path(csv_path).exists():
            logger.warning(f"Skipping non-existent file: {csv_path}")
            continue

        leads = read_csv_prospection(csv_path)

        for lead in leads:
            if lead['phone'] not in seen_phones:
                all_leads.append(lead)
                seen_phones.add(lead)

    logger.info(f"📊 Total unique leads from {len(paths)} CSV files: {len(all_leads)}")
    return all_leads


# ==========================================
# IMPORT FUNCTIONS
# ==========================================

def import_leads_to_db(leads: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Importa leads para Supabase CRM

    For each lead:
    - Checks if already exists (upsert)
    - If new, sets funnel_stage='new', lead_source='prospection_csv'
    - Stores city, neighborhood in metadata

    Args:
        leads: List of lead dictionaries

    Returns:
        Dictionary with import statistics
    """
    stats = {
        'total': len(leads),
        'created': 0,
        'updated': 0,
        'errors': 0,
        'error_list': [],
        'by_city': {},
        'by_status': {}
    }

    for idx, lead in enumerate(leads, 1):
        try:
            # Prepare metadata
            metadata = {
                'city': lead['city'],
                'neighborhood': lead['neighborhood'],
                'website': lead['website'],
                'import_source': 'prospection_csv',
                'import_date': datetime.utcnow().isoformat(),
                'source_file': lead.get('source_file', '')
            }

            # Upsert lead using CRM manager
            result = upsert_lead(
                user_id=DEFAULT_TENANT_ID,
                phone=lead['phone'],
                name=lead['name'] or lead['city'] + ' Barbearia' if lead['city'] else 'Unknown',
                status='new',
                source=LEAD_SOURCE,
                metadata=metadata
            )

            if result.get('success'):
                if result.get('action') == 'created':
                    stats['created'] += 1
                    logger.info(f"✅ Created lead {idx}/{stats['total']}: {lead['name']} ({lead['phone']})")
                else:
                    stats['updated'] += 1
                    logger.info(f"🔄 Updated lead {idx}/{stats['total']}: {lead['name']} ({lead['phone']})")
            else:
                stats['errors'] += 1
                stats['error_list'].append({
                    'phone': lead['phone'],
                    'name': lead['name'],
                    'error': result.get('error')
                })
                logger.error(f"❌ Error on lead {idx}: {result.get('error')}")

            # Track statistics by city
            if lead['city']:
                if lead['city'] not in stats['by_city']:
                    stats['by_city'][lead['city']] = {'created': 0, 'updated': 0}
                if result.get('action') == 'created':
                    stats['by_city'][lead['city']]['created'] += 1
                else:
                    stats['by_city'][lead['city']]['updated'] += 1

            # Progress every 100 leads
            if idx % 100 == 0:
                logger.info(f"📊 Progress: {idx}/{stats['total']} leads processed")

        except Exception as e:
            stats['errors'] += 1
            stats['error_list'].append({
                'phone': lead['phone'],
                'name': lead['name'],
                'error': str(e)
            })
            logger.error(f"❌ Unexpected error on lead {idx}: {e}", exc_info=True)

    # Final summary
    logger.info(f"✅ Import complete: {stats['created']} new, {stats['updated']} updated, {stats['errors']} errors")

    return stats


def generate_import_report(stats: Dict[str, Any], leads: List[Dict]) -> str:
    """
    Gera relatório detalhado da importação em formato texto

    Args:
        stats: Import statistics
        leads: List of all leads processed

    Returns:
        Formatted report string
    """
    report_lines = [
        "=" * 80,
        "RELATÓRIO DE IMPORTAÇÃO DE LEADS DE PROSPECÇÃO",
        "=" * 80,
        "",
        f"📅 Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"🎯 Tenant ID: {DEFAULT_TENANT_ID}",
        f"🙅 Lead Source: {LEAD_SOURCE}",
        "",
        "=" * 80,
        "📊 RESUMO",
        "=" * 80,
        f"📥 Total de leads processados: {stats['total']}",
        f"✅ Novos leads criados: {stats['created']}",
        f"🔄 Leads atualizados: {stats['updated']}",
        f"❌ Erros: {stats['errors']}",
        f"✅ Taxa de sucesso: {((stats['created'] + stats['updated']) / stats['total'] * 100):.1f}%",
        "",
        "=" * 80,
        "🌎 DISTRIBUIÇÃO POR CIDADE (Top 20)",
        "=" * 80,
    ]

    # Sort cities by total leads
    cities_sorted = sorted(
        stats['by_city'].items(),
        key=lambda x: (x[1]['created'] + x[1]['updated']),
        reverse=True
    )[:20]

    for city, counts in cities_sorted:
        total = counts['created'] + counts['updated']
        report_lines.append(f"  {city:30s} | Total: {total:4d} (Novos: {counts['created']:3d}, Atualizados: {counts['updated']:3d})")

    report_lines.extend([
        "",
        "=" * 80,
        "⚠️ ERROS (Primeiros 10)" if stats['error_list'] else "",
        "=" * 80,
    ])

    for err in stats['error_list'][:10]:
        report_lines.append(f"  - {err['name']} ({err['phone']}): {err['error']}")

    if len(stats['error_list']) > 10:
        report_lines.append(f"  ... e mais {len(stats['error_list']) - 10} erros")

    report_lines.extend([
        "",
        "=" * 80,
        "✅ PRÓXIMOS PASSOS",
        "=" * 80,
        "",
        "1. Verifique os dados no Supabase:",
        "   SELECT * FROM crm_leads WHERE user_id = 'prospection'",
        "",
        "2. Verifique o funil:",
        "   SELECT funnel_stage, COUNT(*) FROM crm_leads WHERE user_id = 'prospection' GROUP BY funnel_stage",
        "",
        "3. Comece a usar o CRM de prospecção:",
        "   - Dashboard para ver métricas",
        "   - Filtros para segmentar leads",
        "   - Envios de mensagens em lote",
        "",
    ])

    report_lines.append("=" * 80)

    return "\n".join(report_lines)


# ==========================================
# MAIN FUNCTION
# ==========================================

def main():
    """Função principal de execução"""
    logger.info("🚀 Starting BarbetZap Prospection Leads Import")
    logger.info("=" * 80)

    # Verify CSV files exist
    valid_paths = [p for p in CSV_PATHS if Path(p).exists()]

    if not valid_paths:
        logger.error(f"❌ No valid CSV files found in paths: {CSV_PATHS}")
        sys.exit(1)

    logger.info(f"📂 Valid CSV files: {len(valid_paths)}")
    for path in valid_paths:
        logger.info(f"   - {path}")

    # Read all CSVs and combine leads
    logger.info("\n📖 Reading CSV files...")
    leads = read_all_csvs(valid_paths)

    if not leads:
        logger.error("❌ No valid leads found in CSV files")
        sys.exit(1)

    # Import to database
    logger.info("\n💾 Importing leads to Supabase...")
    stats = import_leads_to_db(leads)

    # Generate report
    logger.info("\n📄 Generating report...")
    report = generate_import_report(stats, leads)

    # Print report to console
    print("\n" + report)

    # Save report to file
    report_path = '/root/Barberzap SITE/data/import_prospection_report.txt'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    logger.info(f"📄 Report saved to: {report_path}")

    # Exit with error if critical
    if stats['errors'] >= stats['total'] * 0.5:  # 50%+ errors
        logger.error("❌ Critical error rate: 50%+ leads failed")
        sys.exit(1)

    logger.info("✅ Import completed successfully!")
    return 0


if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.warning("⚠️ Import interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
        sys.exit(1)
