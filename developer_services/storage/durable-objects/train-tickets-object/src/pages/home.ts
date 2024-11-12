import { html } from 'hono/html';

export const homePage = () => html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Train Ticket App</title>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
                background-color: #f0f2f5;
            }

            .container {
                text-align: center;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                width: 300px;
            }

            h1 {
                color: #333;
            }

            .ticket-count p {
                font-size: 1.2em;
                color: #666;
            }

            button {
                padding: 10px 20px;
                margin: 5px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1em;
                transition: background-color 0.3s;
            }

            #buy-btn {
                background-color: #4CAF50;
                color: white;
            }

            #buy-btn:hover {
                background-color: #45a049;
            }

            #return-btn {
                background-color: #f44336;
                color: white;
            }

            #return-btn:hover {
                background-color: #e53935;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Train Ticket Booking</h1>
            <div class="ticket-count">
                <p>Available Tickets: <span id="ticket-count">Loading...</span></p>
            </div>
            <div class="actions">
                <button id="buy-btn">Buy Ticket</button>
                <button id="return-btn">Return Ticket</button>
            </div>
        </div>

        <script>
            async function updateTicketCount() {
                const response = await fetch('/do/tickets/get_tickets');
                const data = await response.json();
                document.getElementById('ticket-count').textContent = data.count;
            }

            document.getElementById('buy-btn').addEventListener('click', async () => {
                await fetch('/do/tickets/buy_ticket');
                updateTicketCount();
            });

            document.getElementById('return-btn').addEventListener('click', async () => {
                await fetch('/do/tickets/return_ticket');
                updateTicketCount();
            });

            updateTicketCount();
        </script>
    </body>
    </html>
`;
