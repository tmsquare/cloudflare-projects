export function renderEditPage(movie: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edit Movie</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Roboto', sans-serif;
                background-color: #f8f9fa;
                color: #333;
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
            }

            h1 {
                color: #007bff;
                text-align: center;
            }

            table {
                width: 100%;
                margin-top: 20px;
                border-collapse: collapse;
            }

            th, td {
                padding: 12px;
                border: 1px solid #ddd;
                text-align: left;
            }

            th {
                background-color: #007bff;
                color: white;
            }

            td {
                background-color: #f1f1f1;
            }

            form {
                margin-top: 20px;
            }

            label {
                display: block;
                margin: 10px 0 5px;
                color: #333;
            }

            input[type="text"],
            input[type="email"],
            input[type="number"] {
                width: 100%;
                padding: 8px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }

            button {
                padding: 8px 16px;
                border: none;
                background-color: #007bff;
                color: white;
                font-weight: bold;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s;
            }

            button:hover {
                background-color: #0056b3;
            }

            .actions {
                display: flex;
                gap: 8px;
            }

            .container {
                padding: 10px;
                display: grid;
                gap: 20px;
                justify-content: center;
            }

            /* Responsive design */
            @media (max-width: 600px) {
            table, th, td, form, .container {
                width: 100%;
            }

            th, td {
                font-size: 0.9em;
            }

            button {
                padding: 10px;
                width: 100%;
            }

            .actions {
                flex-direction: column;
            }
            }
        </style>
      </head>
      <body>
        <h1>Edit Movie</h1>
        <form method="POST" action="/d1/update/${movie.id}" class="container">
          <label>Title:
            <input type="text" name="title" value="${movie.title}" required>
          </label>
          <label>Director:
            <input type="text" name="director" value="${movie.director}" required>
          </label>
          <label>Release Year:
            <input type="number" name="release_year" value="${movie.release_year}" required min="1900" max="2100">
          </label>
          <label>Genre:
            <input type="text" name="genre" value="${movie.genre}" required>
          </label>
          <label>Rating:
            <input type="number" name="rating" step="0.1" min="0" max="10" value="${movie.rating}" required>
          </label>
          <button type="submit">Update Movie</button>
        </form>
      </body>
      </html>
    `;
  }
  