export const renderHomePage = (duration: number, rows: any[]) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hyperdrive Connection</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Roboto', sans-serif;
                    background-color: #f4f7fb;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .container {
                    background: #fff;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 900px;
                }
                h1 {
                    text-align: center;
                    font-size: 2.5em;
                    color: #4a90e2;
                    margin-bottom: 20px;
                }
                .stats {
                    text-align: center;
                    color: #555;
                    font-size: 1.2em;
                    margin-bottom: 20px;
                }
                .info {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: #f1f1f1;
                    border-radius: 8px;
                    color: #333;
                    font-size: 1.1em;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                    margin: 20px 0;
                }
                li {
                    font-size: 1.1em;
                    margin: 8px 0;
                    color: #444;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    font-size: 1.1em;
                }
                th, td {
                    padding: 12px;
                    border: 1px solid #ddd;
                    text-align: left;
                }
                th {
                    background-color: #4a90e2;
                    color: #fff;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                tr:hover {
                    background-color: #f1f1f1;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>User Data</h1>

                <div class="info">
                    <ul>
                        <li><strong>Via Hyperdrive:</strong> ${duration} ms</li>
                        <li><strong>Direct Access (Lisbon):</strong> 1125.19 ms</li>
                        <li><strong>Hyperdrive TTL:</strong> 60s</li>
                    </ul>
                </div>

                <ul>
                    <li><strong>Database Type:</strong> PostgreSQL</li>
                    <li><strong>Database Location:</strong> North Virginia</li>
                    <li><strong>Number of Rows:</strong> 100 user records</li>
                </ul>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `
                            <tr>
                                <td>${row.id}</td>
                                <td>${row.username}</td>
                                <td>${row.email}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};
