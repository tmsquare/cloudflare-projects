import asyncio
import websockets

async def keep_alive_websocket(uri):
    headers = {
        "username": "John"
    }
    try:
        async with websockets.connect(uri, extra_headers=headers) as websocket:
            print("WebSocket connection established.")

            # Send an initial message if needed
            await websocket.send("Hello Server!")

            # Periodically send a ping every 30 seconds to keep the connection alive
            while True:
                # Receive and print messages from the server
                try:
                    message = await websocket.recv()
                    print(f"Received message: {message}")
                except websockets.ConnectionClosed:
                    print("WebSocket connection closed while waiting for a message.")
                    break
    except Exception as e:
        print(f"Error: {e}")

# Run the WebSocket connection
uri = "wss://ws-tickets.tmsquare.net/websocket"  # Your WebSocket URL
asyncio.get_event_loop().run_until_complete(keep_alive_websocket(uri))


