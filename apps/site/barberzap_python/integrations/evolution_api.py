"""
Evolution API Placeholder Wrapper
==================================

Placeholder para Evolution API do WhatsApp.
Este wrapper será substituído pela implementação real quando o Docker Hub
estiver funcionando.

FASE 2: Convertendo BarberZap do N8N → Python
"""

import logging
from typing import Dict, Optional

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EvolutionAPI:
    """
    Wrapper placeholder para Evolution API.
    
    Este é um wrapper temporário que implementa a interface básica
    da Evolution API sem fazer chamadas reais. Será substituído
    quando a API real estiver disponível via Docker Hub.
    """
    
    def __init__(self, base_url: str = None, api_key: str = None):
        """
        Inicializa o cliente da Evolution API.
        
        Args:
            base_url: URL base da Evolution API (ex: http://localhost:8080)
            api_key: API key para autenticação
        """
        self.base_url = base_url or "http://localhost:8080"
        # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
        self.api_key = api_key
        self.instances: Dict[str, Dict] = {}
        self._instance_counter = 0
        
    def _log_placeholder(self, method_name: str, **kwargs):
        """Loga mensagem de placeholder."""
        params = ", ".join([f"{k}={v}" for k, v in kwargs.items()])
        logger.info(f"[PLACEHOLDER] {method_name} called with: {params}")
        logger.info("  → Este é um wrapper placeholder. Implementação real será adicionada quando Docker Hub estiver disponível.")
        
    def send_message(self, instance_name: str, phone: str, message: str) -> Dict[str, any]:
        """
        Envia uma mensagem WhatsApp via Evolution API.
        
        Args:
            instance_name: Nome da instância da Evolution API
            phone: Número de telefone (formato: 5511999999999@s.whatsapp.net)
            message: Conteúdo da mensagem
            
        Returns:
            Dict com status da operação:
            {
                "success": bool,
                "message_id": str,
                "error": str | None
            }
        """
        # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
        self._log_placeholder("send_message", instance_name=instance_name, phone=phone, message=message[:30] + "..." if len(message) > 30 else message)
        
        # Simula resposta bem-sucedida
        return {
            "success": True,
            "message_id": f"placeholder_msg_{instance_name}_{phone}",
            "error": None
        }
    
    def create_instance(self, instance_name: str = None, qrcode: bool = True) -> Dict[str, any]:
        """
        Cria uma nova instância da Evolution API.
        
        Args:
            instance_name: Nome para a instância (opcional, gerado automaticamente se None)
            qrcode: Se True, gera QR Code para conexão
            
        Returns:
            Dict com dados da instância criada:
            {
                "success": bool,
                "instance_name": str,
                "instance_token": str,
                "qrcode": str | None,
                "error": str | None
            }
        """
        # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
        
        # Gera nome de instância automaticamente se não fornecido
        if instance_name is None:
            self._instance_counter += 1
            instance_name = f"barberzap_instance_{self._instance_counter}"
        
        self._log_placeholder("create_instance", instance_name=instance_name, qrcode=qrcode)
        
        # Registra instância simulada
        self.instances[instance_name] = {
            "name": instance_name,
            "status": "pending",
            "qrcode": f"placeholder_qrcode_{instance_name}"
        }
        
        return {
            "success": True,
            "instance_name": instance_name,
            "instance_token": f"placeholder_token_{instance_name}",
            "qrcode": f"placeholder_qrcode_{instance_name}" if qrcode else None,
            "error": None
        }
    
    def check_status(self, instance_name: str) -> Dict[str, any]:
        """
        Verifica o status de uma instância da Evolution API.
        
        Args:
            instance_name: Nome da instância para verificar
            
        Returns:
            Dict com status da instância:
            {
                "success": bool,
                "instance_name": str,
                "status": str,  # "connected", "disconnected", "pending", "error"
                "phone_number": str | None,
                "error": str | None
            }
        """
        # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
        self._log_placeholder("check_status", instance_name=instance_name)
        
        # Verifica se instância existe (simulado)
        if instance_name in self.instances:
            inst_data = self.instances[instance_name]
            return {
                "success": True,
                "instance_name": instance_name,
                "status": inst_data.get("status", "disconnected"),
                "phone_number": inst_data.get("phone_number"),
                "error": None
            }
        else:
            return {
                "success": False,
                "instance_name": instance_name,
                "status": "not_found",
                "phone_number": None,
                "error": f"Instance '{instance_name}' not found"
            }
    
    def delete_instance(self, instance_name: str) -> Dict[str, any]:
        """
        Remove uma instância da Evolution API.
        
        Args:
            instance_name: Nome da instância para remover
            
        Returns:
            Dict com resultado da operação:
            {
                "success": bool,
                "message": str,
                "error": str | None
            }
        """
        # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
        self._log_placeholder("delete_instance", instance_name=instance_name)
        
        if instance_name in self.instances:
            del self.instances[instance_name]
            return {
                "success": True,
                "message": f"Instance '{instance_name}' deleted successfully",
                "error": None
            }
        else:
            return {
                "success": False,
                "message": f"Instance '{instance_name}' not found",
                "error": "Instance does not exist"
            }
    
    def get_qrcode(self, instance_name: str) -> Dict[str, any]:
        """
        Obtém o QR Code para conectar uma instância.
        
        Args:
            instance_name: Nome da instância
            
        Returns:
            Dict com QR Code:
            {
                "success": bool,
                "qrcode": str | None,
                "base64": str | None,
                "error": str | None
            }
        """
        # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
        self._log_placeholder("get_qrcode", instance_name=instance_name)
        
        if instance_name in self.instances:
            return {
                "success": True,
                "qrcode": f"placeholder_qrcode_{instance_name}",
                "base64": None,
                "error": None
            }
        else:
            return {
                "success": False,
                "qrcode": None,
                "base64": None,
                "error": f"Instance '{instance_name}' not found"
            }


# Instância global para uso no projeto
evolution_api = EvolutionAPI()


# Funções de conveniência para uso direto
def send_message(instance_name: str, phone: str, message: str) -> Dict[str, any]:
    """
    Envia uma mensagem WhatsApp (função de conveniência).
    
    # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
    """
    return evolution_api.send_message(instance_name, phone, message)


def create_instance(instance_name: str = None, qrcode: bool = True) -> Dict[str, any]:
    """
    Cria uma nova instância (função de conveniência).
    
    # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
    """
    return evolution_api.create_instance(instance_name, qrcode)


def check_status(instance_name: str) -> Dict[str, any]:
    """
    Verifica status de uma instância (função de conveniência).
    
    # TODO: INSERT EVOLUTION API KEY WHEN AVAILABLE
    """
    return evolution_api.check_status(instance_name)


if __name__ == "__main__":
    # Teste do placeholder
    print("=== Evolution API Placeholder Test ===\n")
    
    # Criar instância
    result = create_instance("test_instance")
    print(f"✓ Criar instância: {result}\n")
    
    # Verificar status
    result = check_status("test_instance")
    print(f"✓ Verificar status: {result}\n")
    
    # Enviar mensagem
    result = send_message("test_instance", "5511999999999@s.whatsapp.net", "Hello from BarberZap!")
    print(f"✓ Enviar mensagem: {result}\n")
    
    # Obter QR Code
    result = evolution_api.get_qrcode("test_instance")
    print(f"✓ QR Code: {result}\n")
    
    # Deletar instância
    result = evolution_api.delete_instance("test_instance")
    print(f"✓ Deletar instância: {result}\n")
    
    print("=== Placeholder funcionando corretamente ===")
