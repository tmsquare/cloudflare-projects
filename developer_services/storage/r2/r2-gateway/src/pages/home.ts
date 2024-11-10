export const homePage = (bucketItems: string[]) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bucket Browser</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      background-color: #f4f4f9;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2 {
      color: #333;
    }
    h1 {
      border-bottom: 2px solid #007ACC;
      padding-bottom: 0.5em;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      background-color: #e0f7fa;
      margin: 0.5em 0;
      padding: 0.5em;
      border-radius: 5px;
    }
    a {
      text-decoration: none;
      color: #007ACC;
    }
    form {
      background: #fff;
      padding: 1em;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    label, input, button {
      display: block;
      margin: 0.5em 0;
    }
    input[type="file"], input[type="text"] {
      padding: 0.5em;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 100%;
    }
    button {
      background-color: #007ACC;
      color: white;
      border: none;
      padding: 0.7em;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #005f99;
    }
  </style>
</head>
<body>
  <h1>Welcome to Tmsquare Bucket</h1>
  <h2>Bucket Contents</h2>
  <ul>
    ${bucketItems.map(item => `<li><a href="/r2/items/${item}">${item}</a></li>`).join('')}
  </ul>

  <h2>Add New Object</h2>
   <form method="POST" action="/r2/items" enctype="multipart/form-data">
    <label for="userId">Secret:</label>
    <input type="password" id="userId" name="userId" placeholder="Enter your Secret" required>

    <label for="file">Select a file:</label>
    <input type="file" id="file" name="file" required>

    <button type="submit">Upload</button>
  </form>

  <h2>Delete an Object</h2>
   <form method="POST" action="/r2/delete" enctype="multipart/form-data" onsubmit="return confirm('Are you sure you want to delete this item?')>
    <label for="userId">Secret:</label>
    <input type="password" id="userId" name="userId" placeholder="Enter your Secret" required>

    <label for="objectName">Object Name</label>
    <input type="text" id="objectName" name="objectName" placeholder="Enter the object name" required>

    <button type="submit">Delete</button>
  </form>
</body>
</html>
`;