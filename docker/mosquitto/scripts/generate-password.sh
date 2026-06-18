set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CONFIG_DIR="$ROOT_DIR/docker/mosquitto/config"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Erro: .env não encontrado em $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${MQTT_BACKEND_USERNAME:?não definido no .env}"
: "${MQTT_BACKEND_PASSWORD:?não definido no .env}"
: "${MQTT_SIMULATOR_USERNAME:?não definido no .env}"
: "${MQTT_SIMULATOR_PASSWORD:?não definido no .env}"

docker run --rm -v "$CONFIG_DIR:/mosquitto/config" eclipse-mosquitto:2 \
  mosquitto_passwd -b -c /mosquitto/config/passwd \
  "$MQTT_BACKEND_USERNAME" "$MQTT_BACKEND_PASSWORD"

docker run --rm -v "$CONFIG_DIR:/mosquitto/config" eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwd \
  "$MQTT_SIMULATOR_USERNAME" "$MQTT_SIMULATOR_PASSWORD"

echo "Senhas geradas em $CONFIG_DIR/passwd"