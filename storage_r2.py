from typing import Optional, List, Dict
import boto3
from botocore.config import Config
from datetime import datetime
import os
import logging
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do .env
load_dotenv()

logger = logging.getLogger(__name__)


class StorageR2:
    def __init__(self):
        endpoint_url = os.getenv("R2_ENDPOINT_URL")
        access_key = os.getenv("R2_ACCESS_KEY_ID")
        secret_key = os.getenv("R2_SECRET_ACCESS_KEY")

        if not all([endpoint_url, access_key, secret_key]):
            raise ValueError("Credenciais R2 não encontradas nas variáveis de ambiente")

        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(s3={"addressing_style": "virtual"}, region_name="auto"),
        )
        self.bucket = os.getenv("R2_BUCKET_NAME", "fichas-clinica")
        self.public_url_prefix = os.getenv("R2_PUBLIC_URL_PREFIX", "")

    def upload_file(self, local_path: str, dest_name: str) -> Optional[str]:
        """
        Faz upload de um arquivo para o R2 Storage.

        Args:
            local_path (str): Caminho local do arquivo
            dest_name (str): Nome do arquivo no Storage

        Returns:
            Optional[str]: URL pública do arquivo ou None se houver erro
        """
        try:
            logger.info(f"Iniciando upload do arquivo {dest_name}")

            # Faz o upload do arquivo
            self.client.upload_file(
                local_path,
                self.bucket,
                dest_name,
                ExtraArgs={"ContentType": "application/pdf"},
            )

            # Gera a URL pública
            url = f"{self.public_url_prefix}/{dest_name}"
            logger.info(f"Arquivo {dest_name} enviado com sucesso. URL: {url}")
            return url

        except Exception as e:
            logger.error(f"Erro no upload do arquivo: {str(e)}")
            return None

    def delete_files(self, file_names: List[str]) -> bool:
        """
        Deleta múltiplos arquivos do R2 Storage.

        Args:
            file_names (List[str]): Lista com os nomes dos arquivos a serem deletados

        Returns:
            bool: True se todos os arquivos foram deletados com sucesso
        """
        try:
            if not file_names:
                return True

            # Prepara o objeto de deleção em lote
            objects = {"Objects": [{"Key": name} for name in file_names]}

            # Deleta os arquivos
            response = self.client.delete_objects(Bucket=self.bucket, Delete=objects)

            # Verifica se houve erros
            if "Errors" in response and response["Errors"]:
                logger.error(f"Erros na deleção: {response['Errors']}")
                return False

            logger.info(f"Arquivos deletados com sucesso: {file_names}")
            return True

        except Exception as e:
            logger.error(f"Erro ao deletar arquivos: {str(e)}")
            return False

    def list_files(self) -> List[Dict]:
        """
        Lista todos os arquivos no bucket.

        Returns:
            List[Dict]: Lista de arquivos com suas informações
        """
        try:
            response = self.client.list_objects_v2(Bucket=self.bucket)
            files = []

            for obj in response.get("Contents", []):
                files.append(
                    {
                        "nome": obj["Key"],
                        "size": obj["Size"],
                        "created_at": obj["LastModified"].isoformat(),
                        "url": f"{self.public_url_prefix}/{obj['Key']}",
                    }
                )

            return files

        except Exception as e:
            logger.error(f"Erro ao listar arquivos: {str(e)}")
            return []


# Cria uma instância global do StorageR2
storage = StorageR2()
