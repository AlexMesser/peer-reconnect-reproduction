import {createLibp2p} from "libp2p"
import {createFromJSON} from "@libp2p/peer-id-factory"
import {webSockets} from "@libp2p/websockets"
import {noise} from "@chainsafe/libp2p-noise"
import {gossipsub} from "@chainsafe/libp2p-gossipsub"
import {mplex} from "@libp2p/mplex"
import {tcp} from "@libp2p/tcp"
import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery"

async function start() {
  const peerId = {
    id: "12D3KooWNvSZnPi3RrhrTwEY4LuuBeB6K6facKUCJcyWG1aoDd2p",
    privKey:
        "CAESYHyCgD+3HtEHm6kzPO6fuwP+BAr/PxfJKlvAOWhc/IqAwrZjCNn0jz93sSl81cP6R6x/g+iVYmR5Wxmn4ZtzJFnCtmMI2fSPP3exKXzVw/pHrH+D6JViZHlbGafhm3MkWQ==",
    pubKey: "CAESIMK2YwjZ9I8/d7EpfNXD+kesf4PolWJkeVsZp+GbcyRZ",
  }
  try {
    const libp2p = await createLibp2p({
      peerId: await createFromJSON(peerId),
      addresses: {
        listen: [
          "/ip4/0.0.0.0/tcp/5001",
          "/ip4/0.0.0.0/tcp/5002/ws",
        ],
        announce: [
          "/ip4/0.0.0.0/tcp/5001",
          "/ip4/0.0.0.0/tcp/5002/ws",
        ],
      },
      pubsub: gossipsub({
        allowPublishToZeroPeers: true,
      }),
      transports: [tcp(), webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()],
      peerDiscovery: [
        // @ts-ignore package has broken typings
        pubsubPeerDiscovery({
          interval: 1000,
        }),
      ],
      relay: {
        // Circuit Relay options (this config is part of libp2p core configurations)
        enabled: true, // Allows you to dial and accept relayed connections. Does not make you a relay.
        hop: {
          enabled: true, // Allows you to be a relay for other peers
          active: true, // You will attempt to dial destination peers if you are not connected to them
        },
        advertise: {
          bootDelay: 15 * 60 * 1000, // Delay before HOP relay service is advertised on the network
          enabled: true, // Allows you to disable the advertise of the Hop service
          ttl: 30 * 60 * 1000, // Delay Between HOP relay service advertisements on the network
        },
        autoRelay: {
          enabled: true, // Allows you to bind to relays with HOP enabled for improving node dialability
          maxListeners: 2, // Configure maximum number of HOP relays to use
        },
      },
    })

    // Listen for new connections to peers
    libp2p.connectionManager.addEventListener("peer:connect", async (evt) => {
      const connection = evt.detail
      console.log(`Connected to ${connection.remotePeer.toString()}`)
    })

    // Listen for peers disconnecting
    libp2p.connectionManager.addEventListener("peer:disconnect", (evt) => {
      const connection = evt.detail
      console.log(`Disconnected from ${connection.remotePeer.toString()}`)
    })

    await libp2p.start()
    console.log("----------------------------------------------")
    console.log("PeerId:", libp2p.peerId.toString())
    console.log(
      "Listening on:",
      libp2p.getMultiaddrs().map((it) => it.toString()),
    )
    console.log("----------------------------------------------")
  } catch (err) {
    console.error(err)
  }
}

start()
