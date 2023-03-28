const mqtt = require('mqtt');
const { WebSocketServer } = require('ws');
const host = '192.168.0.27'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`;
const sockserver = new WebSocketServer({ port: 5502 });

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
})

const topic = 'inTopic';
const topic2 = "outTopic";

let on = true;
function toggle() {
    on = !on;
    client.publish(topic, on ? '1' : "0", { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
    })
}

client.on('connect', () => {
  console.log('Connected')
  client.subscribe([topic, topic2], () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})

client.on('message', (_topic, payload) => {
    const data = payload.toString();
    console.log(data);
    if (data.includes("hello world")) {
        sockserver.clients.forEach(client => {
            console.log(`distributing message: ${data}`)
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
})

sockserver.on('connection', ws => {
    console.log('New client connected!')
    ws.send('connection established')
    ws.on('close', () => console.log('Client has disconnected!'))
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
      console.log('websocket error')
    }
})