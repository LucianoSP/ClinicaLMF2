import anthropic
import base64
import csv
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def extract_info_from_pdf(pdf_path):
    if not os.path.isfile(pdf_path):
        raise Exception(f"Arquivo não encontrado: {pdf_path}")

    with open(pdf_path, "rb") as pdf_file:
        pdf_data = base64.b64encode(pdf_file.read()).decode("utf-8")

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    response = client.beta.messages.create(
        model="claude-3-5-sonnet-20240620",
        betas=["pdfs-2024-09-25"],
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": """
                    Extraia as seguintes informações do PDF:
                    1. Data do primeiro atendimento (campo 11)
                    2. Número da carteira (campo 12)
                    3. Nome do beneficiário (campo 13)
                    4. Número da guia principal (campo 14)
                    Retorne apenas esses valores, separados por |
                """,
                    },
                ],
            }
        ],
    )

    try:
        dados = response.content[0].text.strip().split("|")
        info = {
            "data": dados[0].strip(),
            "carteira": dados[1].strip(),
            "nome_paciente": dados[2].strip(),
            "numero_guia": dados[3].strip(),
        }
    except Exception as e:
        raise Exception(f"Erro ao processar resposta da API: {str(e)}")

    return info


def save_to_csv(processed_files):
    os.makedirs("resultados", exist_ok=True)

    for info in processed_files:
        data_formatada = info["data"].replace("/", "-")
        csv_nome = (
            f"{info['numero_guia']} - {data_formatada}-{info['nome_paciente']}.csv"
        )
        csv_path = os.path.join("resultados", csv_nome)

        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                ["Data", "Carteira", "Beneficiário", "Guia Principal", "Assinatura"]
            )

            # Primeira linha com assinatura
            writer.writerow(
                [
                    info["data"],
                    info["carteira"],
                    info["nome_paciente"],
                    info["numero_guia"],
                    "SIM",
                ]
            )

            # Segunda linha com assinatura
            writer.writerow(
                [
                    info["data"],
                    info["carteira"],
                    info["nome_paciente"],
                    info["numero_guia"],
                    "SIM",
                ]
            )
        print(f"CSV salvo: {csv_nome}")


def process_directory():
    try:
        if not os.path.exists("pdfs_origem"):
            raise Exception("Pasta 'pdfs_origem' não encontrada")

        pdf_files = [f for f in os.listdir("pdfs_origem") if f.endswith(".pdf")]

        if not pdf_files:
            print("Nenhum arquivo PDF encontrado na pasta 'pdfs_origem'")
            return

        print(f"Encontrados {len(pdf_files)} arquivos para processar.")
        processed_files = []

        for index, pdf_file in enumerate(pdf_files, 1):
            pdf_path = os.path.join("pdfs_origem", pdf_file)
            print(f"\nProcessando arquivo {index}/{len(pdf_files)}: {pdf_file}")

            try:
                info = extract_info_from_pdf(pdf_path)
                processed_files.append(info)  # Agora appendamos diretamente o info
                print(f"✓ Informações extraídas com sucesso")

            except Exception as e:
                print(f"❌ Erro ao processar {pdf_file}: {str(e)}")

        if processed_files:
            save_to_csv(processed_files)
            print(
                f"\nProcessamento concluído. {len(processed_files)} arquivos processados."
            )
            print("Arquivos CSV salvos na pasta 'resultados'")

    except Exception as e:
        print(f"Erro crítico: {str(e)}")


if __name__ == "__main__":
    print("Iniciando processamento dos PDFs...")
    process_directory()
