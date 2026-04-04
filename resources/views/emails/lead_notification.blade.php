<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Lead Notification</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            color: #11151C;
            /* bv-black */
            background-color: #F4EDE4;
            /* bv-white */
            padding: 20px;
        }

        h1 {
            color: #11151C;
            /* bv-black */
            font-size: 24px;
        }

        h3 {
            color: #11151C;
            /* bv-black */
            font-size: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background-color: #FFFFFF;
            /* White for table background */
            border: 1px solid #D3CAC2;
            /* Light border color */
        }

        th,
        td {
            padding: 12px;
            text-align: left;
            border: 1px solid #D3CAC2;
            /* Light border color */
        }

        th {
            background-color: #F7D9A6;
            /* bv-yellow */
            color: #11151C;
            /* bv-black */
            font-weight: bold;
        }

        td {
            background-color: #FFFFFF;
        }

        .preferences-table th,
        .preferences-table td {
            border: 1px solid #C08310;
            /* bv-brown */
        }

        .preferences-table th {
            background-color: #F7D9A6;
            /* Light brown */
        }

        .footer {
            margin-top: 30px;
            color: #11151C;
            /* bv-black */
        }

        .footer p {
            margin: 5px 0;
        }
    </style>
</head>

<body>
    @php
    function formatValue($value) {
    $decoded = json_decode($value, true);

    if (is_array($decoded)) {
    // Listar com vírgulas ou como <ul>
        return '<ul style="margin: 0; padding-left: 20px;">' . collect($decoded)->map(function($item) {
            if (is_array($item)) {
            return '<li>' . json_encode($item) . '</li>';
            }
            return '<li>' . e($item) . '</li>';
            })->implode('') . '</ul>';
        }

        return e($value);
        }
        @endphp

        <h1>New Lead Received</h1>

        <table>
            <tr>
                <th>Name</th>
                <td>{{ $lead->name }}</td>
            </tr>
            <tr>
                <th>Email</th>
                <td>{{ $lead->email }}</td>
            </tr>
            <tr>
                <th>Message</th>
                <td>{{ $lead->message }}</td>
            </tr>
            <tr>
                <th>Form</th>
                <td>{{ $lead->form }}</td>
            </tr>
        </table>

        <h3>Attributes:</h3>
        <table class="preferences-table">
            <thead>
                <tr>
                    <th>Atrribute: </th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                @foreach($lead->attributes as $attribute)
                <tr>
                    <td>{{ $attribute->label }}</td>
                    <td>{!! formatValue($attribute->value) !!}</td>
                </tr>
                @endforeach

            </tbody>
        </table>
</body>

</html>