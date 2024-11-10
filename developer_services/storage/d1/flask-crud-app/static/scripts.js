function submitForm() {
    var formData = {
        database: $('#database').val(),
        table: $('#table').val(),
        operation: $('#operation').val(),
        time_stamp: $('#time_stamp').val(),
        IP: $('#IP').val(),
        rl_count: $('#rl_count').val(),
        flag: $('#flag').val()
    };
    $.ajax({
        type: 'POST',
        url: '/api/crud',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(formData),
        success: function (response) {
            $('#result').html(response);
        }
    });
}

$('#database').change(function () {
    // Fetch tables dynamically based on the selected database
    var selectedDatabase = $('#database').val();
    // Perform an AJAX request to get tables for the selected database
    // Update the options of the 'table' dropdown with the received data
    // Example: Assuming you have an endpoint to get tables (/api/tables?database=selectedDatabase)
    $.get(`/api/tables?database=${selectedDatabase}`, function (data) {
        // Update the 'table' dropdown options
        var tableDropdown = $('#table');
        tableDropdown.empty();
        $.each(data.tables, function (index, value) {
            tableDropdown.append($('<option>').text(value).val(value));
        });
    });
});

function fetchData() {
    var selectedDatabase = $('#readDatabase').val();
    var selectedTable = $('#readTable').val();
    // Perform an AJAX request to fetch data for the selected database and table
    // Update the 'readResult' div with the received data
    // Example: Assuming you have an endpoint to get data (/api/data?database=selectedDatabase&table=selectedTable)
    $.get(`/api/data?database=${selectedDatabase}&table=${selectedTable}`, function (data) {
        // Update the 'readResult' div with the received data
        $('#readResult').html(data);
    });
}
