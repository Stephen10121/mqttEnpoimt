const mqtt = require('mqtt');
const { WebSocketServer } = require('ws');
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT) || 5502;
const MQTT_HOST = process.env.MQTT_HOST || "192.168.0.27";
const MQTT_PORT = process.env.MQTT_PORT || "1883";

console.log(`Websocket Port: ${WEBSOCKET_PORT}`);
console.log(`Mqtt Host: ${MQTT_HOST}`);
console.log(`Mqtt Port: ${MQTT_PORT}`);

const connectUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;
const sockserver = new WebSocketServer({ port: WEBSOCKET_PORT });

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
});

const topic = 'inTopic';
const topic2 = "outTopic";

let on = true;
function toggle() {
    on = !on;
    client.publish(topic, on ? '1' : "0", { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error);
        }
    })
}

client.on('connect', () => {
  console.log('Connected');
  client.subscribe([topic, topic2], () => {
    console.log(`Subscribe to topic '${topic}'`);
  });
});

client.on('message', (_topic, payload) => {
    const data = payload.toString();
    console.log(data);
    if (data.includes("hello world")) {
        sockserver.clients.forEach(client => {
            console.log(`distributing message: ${data}`);
            client.send(data);
        });
    }
    if (data.substring(0,4) !== "json") return

    try {
        var jsonData = JSON.parse(data.substring(4));
    } catch (err) {
        console.log("Invalid JSON");
        return
    }

    console.log(jsonData);
});

sockserver.on('connection', ws => {
    console.log('New client connected!');
    ws.send('connection established');
    ws.on('close', () => console.log('Client has disconnected!'));
    ws.on('message', data => {
        console.log(data.toString());
        if (data.toString() === "toggle") {
            toggle();
        }
    //   sockserver.clients.forEach(client => {
    //     console.log(`distributing message: ${JSON.parse(data)}`)
    //     client.send(`${data}`)
    //   });
    })
    ws.onerror = function () {
      console.log('websocket error');
    }
})