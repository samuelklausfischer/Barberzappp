import pandas as pd
import re

def limpar_numero(numero):
    # Remove tudo que não é número
    numero = re.sub(r'\D', '', str(numero))
    
    # Se o número não começar com 55, adiciona
    if not numero.startswith('55'):
        numero = '55' + numero
    
    # Verifica se tem o tamanho correto (55 + DDD + 8 ou 9 dígitos)
    if 12 <= len(numero) <= 13:
        return numero
    return None

def preparar_lista_meta(arquivo_entrada, arquivo_saida):
    # Carrega a lista (supondo que a coluna com números se chame 'telefone' ou 'whatsapp')
    try:
        df = pd.read_csv(arquivo_entrada)
        
        # Identifica a coluna de telefone
        coluna_tel = None
        for col in df.columns:
            if 'tel' in col.lower() or 'whatsapp' in col.lower() or 'fone' in col.lower():
                coluna_tel = col
                break
        
        if not coluna_tel:
            print("Não encontrei coluna de telefone no arquivo.")
            return

        # Limpa os números
        df['phone'] = df[coluna_tel].apply(limpar_numero)
        
        # Remove números inválidos
        df = df.dropna(subset=['phone'])
        
        # Mantém apenas a coluna 'phone' (formato que o Meta prefere para match rápido)
        # Se tiver nome e email, o Meta também aceita e melhora o match
        lista_meta = df[['phone']]
        
        # Salva para upload
        lista_meta.to_csv(arquivo_saida, index=False)
        print(f"Sucesso! Lista salva em {arquivo_saida}")
        print(f"Total de contatos válidos: {len(lista_meta)}")

    except Exception as e:
        print(f"Erro ao processar: {e}")

# Instrução: Salve sua extração como 'extração_maps.csv' e rode este script
# preparar_lista_meta('extração_maps.csv', 'lista_pronta_para_meta.csv')
