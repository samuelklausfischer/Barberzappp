"""
BarberZap PostgreSQL Memory Wrapper
Wrapper para memória de chat usando PostgreSQL.
Fase 2 - Migração N8N → Python
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from typing import List, Dict, Optional
from datetime import datetime


# Configurações do PostgreSQL
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db.htssqiupscyhhueqwpgu.supabase.co")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "postgres")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")


class PostgresMemory:
    """Wrapper para gerenciamento de memória de chat no PostgreSQL."""
    
    def __init__(
        self,
        host: str = POSTGRES_HOST,
        port: int = POSTGRES_PORT,
        database: str = POSTGRES_DB,
        user: str = POSTGRES_USER,
        password: str = POSTGRES_PASSWORD
    ):
        """
        Inicializa a conexão com o PostgreSQL.
        
        Args:
            host: Host do PostgreSQL
            port: Porta do PostgreSQL
            database: Nome do banco de dados
            user: Usuário do PostgreSQL
            password: Senha do PostgreSQL
        """
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password
        self._connection = None
        
    def _get_connection(self):
        """Obtém ou cria uma conexão com o banco de dados."""
        if self._connection is None or self._connection.closed:
            self._connection = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
        return self._connection
    
    def _get_session_key(self, tenant_id: str, phone: str) -> str:
        """
        Gera a chave de sessão baseada em tenant_id e phone.
        
        Args:
            tenant_id: ID do tenant
            phone: Número de telefone
            
        Returns:
            Chave de sessão no formato {tenant_id}_{phone}
        """
        return f"{tenant_id}_{phone}"
    
    def save_message(
        self,
        tenant_id: str,
        phone: str,
        role: str,
        message: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Salva uma mensagem no histórico de chat.
        
        Args:
            tenant_id: ID do tenant
            phone: Número de telefone do usuário
            role: Papel da mensagem ('user' ou 'assistant')
            message: Conteúdo da mensagem
            metadata: Metadados adicionais (opcional)
            
        Returns:
            Dict com status da operação (success, message)
        """
        session_key = self._get_session_key(tenant_id, phone)
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            query = """
                INSERT INTO chat_memoria_v4 
                (session_key, tenant_id, phone, role, message, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            
            cursor.execute(
                query,
                (
                    session_key,
                    tenant_id,
                    phone,
                    role,
                    message,
                    Json(metadata) if metadata else None,
                    datetime.utcnow()
                )
            )
            
            message_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            
            return {
                "success": True,
                "message": "Mensagem salva com sucesso",
                "id": message_id,
                "session_key": session_key
            }
            
        except Exception as e:
            if conn:
                conn.rollback()
            return {
                "success": False,
                "message": f"Erro ao salvar mensagem: {str(e)}",
                "error": str(e)
            }
    
    def get_chat_history(
        self,
        tenant_id: str,
        phone: str,
        limit: int = 40
    ) -> Dict:
        """
        Recupera o histórico de chat de um usuário.
        
        Args:
            tenant_id: ID do tenant
            phone: Número de telefone do usuário
            limit: Número máximo de mensagens a retornar (default: 40)
            
        Returns:
            Dict com histórico de mensagens
        """
        session_key = self._get_session_key(tenant_id, phone)
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT 
                    id,
                    session_key,
                    tenant_id,
                    phone,
                    role,
                    message,
                    metadata,
                    created_at
                FROM chat_memoria_v4
                WHERE session_key = %s
                ORDER BY created_at ASC
                LIMIT %s
            """
            
            cursor.execute(query, (session_key, limit))
            messages = cursor.fetchall()
            cursor.close()
            
            # Converter datetime para string para JSON serialization
            message_list = []
            for msg in messages:
                msg_dict = dict(msg)
                if msg_dict.get('created_at'):
                    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
                message_list.append(msg_dict)
            
            return {
                "success": True,
                "messages": message_list,
                "count": len(message_list),
                "session_key": session_key
            }
            
        except Exception as e:
            return {
                "success": False,
                "messages": [],
                "message": f"Erro ao recuperar histórico: {str(e)}",
                "error": str(e)
            }
    
    def clear_chat_history(
        self,
        tenant_id: str,
        phone: str
    ) -> Dict:
        """
        Limpa todo o histórico de chat de um usuário.
        
        Args:
            tenant_id: ID do tenant
            phone: Número de telefone do usuário
            
        Returns:
            Dict com status da operação
        """
        session_key = self._get_session_key(tenant_id, phone)
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Primeiro contar quantas mensagens serão deletadas
            count_query = """
                SELECT COUNT(*) 
                FROM chat_memoria_v4
                WHERE session_key = %s
            """
            cursor.execute(count_query, (session_key,))
            count = cursor.fetchone()[0]
            
            # Deletar as mensagens
            delete_query = """
                DELETE FROM chat_memoria_v4
                WHERE session_key = %s
            """
            cursor.execute(delete_query, (session_key,))
            
            conn.commit()
            cursor.close()
            
            return {
                "success": True,
                "message": f"Histórico limpo com sucesso",
                "deleted_count": count,
                "session_key": session_key
            }
            
        except Exception as e:
            if conn:
                conn.rollback()
            return {
                "success": False,
                "message": f"Erro ao limpar histórico: {str(e)}",
                "error": str(e)
            }
    
    def get_last_message(
        self,
        tenant_id: str,
        phone: str
    ) -> Dict:
        """
        Recupera a última mensagem de um usuário.
        
        Args:
            tenant_id: ID do tenant
            phone: Número de telefone do usuário
            
        Returns:
            Dict com a última mensagem
        """
        session_key = self._get_session_key(tenant_id, phone)
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT 
                    id,
                    session_key,
                    tenant_id,
                    phone,
                    role,
                    message,
                    metadata,
                    created_at
                FROM chat_memoria_v4
                WHERE session_key = %s
                ORDER BY created_at DESC
                LIMIT 1
            """
            
            cursor.execute(query, (session_key,))
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                msg_dict = dict(result)
                if msg_dict.get('created_at'):
                    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
                return {
                    "success": True,
                    "message": msg_dict,
                    "session_key": session_key
                }
            else:
                return {
                    "success": True,
                    "message": None,
                    "session_key": session_key
                }
            
        except Exception as e:
            return {
                "success": False,
                "message": None,
                "error": f"Erro ao recuperar última mensagem: {str(e)}"
            }
    
    def count_messages(
        self,
        tenant_id: str,
        phone: str
    ) -> Dict:
        """
        Conta o número de mensagens de um usuário.
        
        Args:
            tenant_id: ID do tenant
            phone: Número de telefone do usuário
            
        Returns:
            Dict com o contador de mensagens
        """
        session_key = self._get_session_key(tenant_id, phone)
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT COUNT(*) 
                FROM chat_memoria_v4
                WHERE session_key = %s
            """
            
            cursor.execute(query, (session_key,))
            count = cursor.fetchone()[0]
            cursor.close()
            
            return {
                "success": True,
                "count": count,
                "session_key": session_key
            }
            
        except Exception as e:
            return {
                "success": False,
                "count": 0,
                "error": f"Erro ao contar mensagens: {str(e)}"
            }
    
    def close(self):
        """Fecha a conexão com o banco de dados."""
        if self._connection and not self._connection.closed:
            self._connection.close()
            self._connection = None
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Instância global padrão
_default_instance: Optional[PostgresMemory] = None


def get_memory() -> PostgresMemory:
    """
    Retorna uma instância singleton do PostgresMemory.
    
    Returns:
        Instância de PostgresMemory
    """
    global _default_instance
    if _default_instance is None:
        _default_instance = PostgresMemory()
    return _default_instance


# Funções de conveniência para uso direto
def save_message(tenant_id: str, phone: str, role: str, message: str, metadata: Optional[Dict] = None) -> Dict:
    """Salva uma mensagem usando a instância padrão."""
    return get_memory().save_message(tenant_id, phone, role, message, metadata)


def get_chat_history(tenant_id: str, phone: str, limit: int = 40) -> List[Dict]:
    """
    Recupera o histórico de chat usando a instância padrão.
    
    Returns:
        Lista de mensagens ou lista vazia em caso de erro
    """
    result = get_memory().get_chat_history(tenant_id, phone, limit)
    return result.get("messages", []) if result["success"] else []


def clear_chat_history(tenant_id: str, phone: str) -> Dict:
    """Limpa o histórico de chat usando a instância padrão."""
    return get_memory().clear_chat_history(tenant_id, phone)


if __name__ == "__main__":
    # Testes rápidos
    print("🧪 Testando PostgresMemory Wrapper")
    print("=" * 50)
    
    # Testar com variáveis de ambiente
    print(f"\n📡 Conectando ao PostgreSQL em: {POSTGRES_HOST}:{POSTGRES_PORT}")
    print(f"📂 Banco de dados: {POSTGRES_DB}")
    
    with PostgresMemory() as mem:
        # Testar save_message
        print("\n✅ Testando save_message...")
        result = mem.save_message(
            tenant_id="test_tenant",
            phone="5511999999999",
            role="user",
            message="Mensagem de teste",
            metadata={"test": True}
        )
        print(f"Resultado: {result}")
        
        # Testar get_chat_history
        print("\n📜 Testando get_chat_history...")
        history = mem.get_chat_history(
            tenant_id="test_tenant",
            phone="5511999999999",
            limit=10
        )
        print(f"Resultado: {history}")
        
        # Testar clear_chat_history
        print("\n🗑️  Testando clear_chat_history...")
        clear = mem.clear_chat_history(
            tenant_id="test_tenant",
            phone="5511999999999"
        )
        print(f"Resultado: {clear}")
    
    print("\n✨ Testes concluídos!")
