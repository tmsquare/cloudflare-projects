import { html } from 'hono/html';

export const homePage = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seat Management</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
            color: #333;
        }

        .container {
            text-align: center;
            background: #ffffff;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 500px;
            width: 90%;
            transition: transform 0.2s ease;
        }

        .container:hover {
            transform: translateY(-5px);
        }

        h1 {
            font-size: 1.8em;
            margin-bottom: 10px;
            color: #4CAF50;
        }

        .seat-status p {
            font-size: 1.2em;
            margin: 10px 0;
            color: #555;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        }

        input[type="text"] {
            padding: 10px;
            font-size: 1em;
            border: 1px solid #ddd;
            border-radius: 8px;
            width: 100%;
            transition: border-color 0.3s ease;
        }

        input[type="text"]:focus {
            border-color: #4CAF50;
            outline: none;
        }

        button {
            padding: 12px;
            font-size: 1em;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            color: white;
        }

        .assign-seat-btn {
            background-color: #4CAF50;
        }

        .assign-seat-btn:hover {
            background-color: #45a049;
        }

        .reset-btn {
            background-color: #f44336;
        }

        .reset-btn:hover {
            background-color: #e53935;
        }

        .status-message {
            margin-top: 15px;
            font-size: 1em;
            color: #4CAF50;
        }

        @media (max-width: 600px) {
            h1 {
                font-size: 1.5em;
            }

            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Seat Management</h1>
        <div class="seat-status">
            <p>Available Seats: <span id="available-seats">Loading...</span></p>
        </div>
        <div class="form-group">
            <input type="text" id="seat-id" placeholder="Seat ID (e.g., 3B)">
            <input type="text" id="occupant" placeholder="Passenger Name">
        </div>
        <button class="assign-seat-btn" onclick="assignSeat()">Assign Seat</button>
        <button class="reset-btn" onclick="resetSeats()">Reset All Seats</button>
        <p id="status-message" class="status-message"></p>
    </div>

    <script>
        async function fetchAvailableSeats() {
            const response = await fetch('/do/flight-seat-sql/get-available-seats');
            const data = await response.json();
            document.getElementById('available-seats').textContent = data.seats;
        }

        async function assignSeat() {
            const seatId = document.getElementById('seat-id').value;
            const occupant = document.getElementById('occupant').value;
            if (!seatId || !occupant) {
                document.getElementById('status-message').textContent = "Please enter both seat ID and occupant name.";
                return;
            }
            const response = await fetch(\`/do/flight-seat-sql/assign-seat?seatId=\${seatId}&occupant=\${occupant}\`);
            document.getElementById('status-message').textContent = await response.text();
            fetchAvailableSeats();
        }

        async function resetSeats() {
            const response = await fetch('/do/flight-seat-sql/reset-all');
            document.getElementById('status-message').textContent = await response.text();
            fetchAvailableSeats();
        }

        fetchAvailableSeats();
    </script>
</body>
</html>
`;
