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
                    5. Nome da clínica (campo 7)
                    6. Nome do profissional (campo 18)
                    7. Número do conselho (campo 19)
                    8. Assinatura do contratado (campo 45)
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
            "nome_clinica": dados[4].strip(),
            "profissional": dados[5].strip(),
            "conselho": dados[6].strip(),
            "assinatura_contratado": dados[7].strip(),
        }
    except Exception as e:
        raise Exception(f"Erro ao processar resposta da API: {str(e)}")

    return info


def save_to_files(processed_files):
    os.makedirs("resultados", exist_ok=True)

    for info in processed_files:
        base_name = f"{info['numero_guia']} - {info['data'].replace('/', '-')}-{info['nome_paciente']}"

        # Save CSV
        csv_path = os.path.join("resultados", f"{base_name}.csv")
        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                ["Data", "Carteira", "Beneficiário", "Guia Principal", "Assinatura"]
            )

            for _ in range(2):  # Write two identical rows
                writer.writerow(
                    [
                        info["data"],
                        info["carteira"],
                        info["nome_paciente"],
                        info["numero_guia"],
                        "SIM",
                    ]
                )

        # Save Markdown
        md_path = os.path.join("resultados", f"{base_name}.md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write("# Guia Comprovante Presencial\n\n")
            f.write(f"**Número do Guia:** {info['numero_guia']}\n")
            f.write(f"**Nome da Clínica:** {info['nome_clinica']}\n")
            f.write(f"**Profissional:** {info['profissional']}\n")
            f.write(f"**Conselho:** {info['conselho']}\n")
            f.write(f"**Data:** {info['data']}\n")
            f.write(
                f"**Assinatura do Contratado:** {info['assinatura_contratado']}\n\n"
            )

            f.write("## Atendimentos\n\n")
            f.write(
                "| Data | Carteira | Beneficiário | Guia Principal | Assinatura |\n"
            )
            f.write(
                "|------|----------|--------------|----------------|------------|\n"
            )

            # Write two identical rows
            for _ in range(2):
                f.write(
                    f"| {info['data']} | {info['carteira']} | {info['nome_paciente']} | {info['numero_guia']} | ✓ |\n"
                )

        print(f"Arquivos salvos: {base_name}.csv e {base_name}.md")


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
            save_to_files(processed_files)
            print(
                f"\nProcessamento concluído. {len(processed_files)} arquivos processados."
            )
            print("Arquivos CSV e Markdown salvos na pasta 'resultados'")

    except Exception as e:
        print(f"Erro crítico: {str(e)}")


if __name__ == "__main__":
    print("Iniciando processamento dos PDFs...")
    process_directory()
