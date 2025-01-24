from redis import Redis
import time
import json

def monitor_task(task_id):
    # Conecta ao Redis
    redis_conn = Redis(host="0.0.0.0", port=6379, decode_responses=True)
    
    print(f"Monitorando tarefa {task_id}...")
    print("-" * 50)
    
    last_status = None
    while True:
        try:
            # Obtém todos os campos do hash
            current_status = redis_conn.hgetall(f"task:{task_id}")
            
            # Se o status mudou, exibe as informações
            if current_status != last_status:
                print("\nStatus atualizado:")
                print(json.dumps(current_status, indent=2, ensure_ascii=False))
                last_status = current_status.copy()
                
                # Se o status for completed ou failed, encerra o monitoramento
                if current_status.get("status") in ["completed", "failed"]:
                    print("\nTarefa finalizada!")
                    break
            
            time.sleep(1)  # Aguarda 1 segundo antes de verificar novamente
            
        except KeyboardInterrupt:
            print("\nMonitoramento interrompido pelo usuário")
            break
        except Exception as e:
            print(f"\nErro ao monitorar: {str(e)}")
            break

if __name__ == "__main__":
    task_id = input("Digite o ID da tarefa para monitorar: ")
    monitor_task(task_id)
