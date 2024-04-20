get_todos();

function get_todos() {
    var request = new XMLHttpRequest();
    var requestURL = '/get_todos';
    request.open('GET', requestURL);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        var todos = request.response;
        printTodos(todos);
    }
};

function getTodoData(todo_id, callback) {
    var request = new XMLHttpRequest();
    var requestURL = '/edit_todo/' + todo_id;
    request.open('GET', requestURL);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        console.log(request.status); // Log the status code        
        console.log(request.response); // Log the response
        if (request.status >= 200 && request.status < 400) {
            var todo = request.response;
            console.log("Todo contains: ", todo);
            callback(todo);
        } else {
            console.error('Server reached, but encountered an error');
        }
    };
    request.onerror = function() {
        console.error('Unable to reach the server');
    };
}

function printTodos(todos){
    var table = document.getElementById("todo_table");

    for (var i in todos){
       const todo_id = todos[i].todo_id;
       const todo = todos[i].todo;
       var row = document.createElement("tr");
       row.className = "todo-row";
       var todo_cell = document.createElement("td");
       
       // Create a container for the todo message
       var todoMessageContainer = document.createElement("div");
       todoMessageContainer.className = "todo-message";

       // Display the todo message
       var todoMessage = document.createTextNode(todo);
       todoMessageContainer.appendChild(todoMessage);
       todo_cell.appendChild(todoMessageContainer);

       // Create a container for buttons
       var buttonContainer = document.createElement("div");
       buttonContainer.className = "button-container";

       // Complete Button
       var completeButton = document.createElement("button");
       completeButton.id = "complete_button";
       completeButton.innerHTML = "Complete";
       completeButton.addEventListener("click", function() { completeTodo(todo_id); });
       buttonContainer.appendChild(completeButton);

       // Edit Button
        var editButton = document.createElement("button");
        editButton.id = "edit_button_" + todo_id;
        editButton.innerHTML = "Edit";
        editButton.addEventListener("click", function() { editTodo(todo_id, this); });
        buttonContainer.appendChild(editButton);

        // Save Button
        var saveButton = document.createElement("button");
        saveButton.style.display = "none"; // Hide the save button initially
        saveButton.id = "save_button_" + todo_id;
        saveButton.innerHTML = "Save";
        saveButton.addEventListener("click", function() { saveTodo(todo_id, this); });
        buttonContainer.appendChild(saveButton);

       // Delete Button
       var deleteButton = document.createElement("button");
       deleteButton.id = "delete_button";
       deleteButton.innerHTML = "Delete";
       deleteButton.addEventListener("click", function() { deleteTodo(todo_id); });
       buttonContainer.appendChild(deleteButton);

       // Append button container to the todo cell
       todo_cell.appendChild(buttonContainer);

       row.appendChild(todo_cell);
       table.appendChild(row);
    }
};

function completeTodo(todo_id) {
    var form = document.getElementById("complete_todo_form");
    form.action = form.action + todo_id;
    form.submit();
};

function editTodo(todo_id, editButton) {
    // Get the todo message container
    var todoMessageContainer = editButton.parentElement.previousSibling;
    
    // Create an input field and populate it with the current todo message
    var inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = todoMessageContainer.textContent;
    inputField.id = "input_" + todo_id;

    // Replace the todo message with the input field
    todoMessageContainer.replaceWith(inputField);

    // Hide the edit button and show the save button
    editButton.style.display = "none";
    document.getElementById("save_button_" + todo_id).style.display = "block";
};

function saveTodo(todo_id, saveButton) {
    // Get the input field
    var inputField = saveButton.parentElement.previousSibling;

    // Create a todo message container and populate it with the updated todo message
    var todoMessageContainer = document.createElement("div");
    todoMessageContainer.className = "todo-message";
    var todoMessage = document.createTextNode(inputField.value);
    todoMessageContainer.appendChild(todoMessage);

    // Replace the input field with the todo message
    inputField.replaceWith(todoMessageContainer);

    // Hide the save button and show the edit button
    saveButton.style.display = "none";
    document.getElementById("edit_button_" + todo_id).style.display = "block";

    // You can add code here to update the todo message on the server
    // Prepare the data to send in the POST request
    var data = {
        todo_id: todo_id,
        todo_message: inputField.value,
        _csrf: document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    };

    // Make an HTTP POST request to update the todo
    var request = new XMLHttpRequest();
    var requestURL = '/update_todo/' + todo_id;
    request.open('POST', requestURL);
    request.setRequestHeader('Content-Type', 'application/json');

    // Convert data to JSON format and send the request
    request.send(JSON.stringify(data));

    // Handle response from the server (optional)
    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            // Handle successful response if needed 
            console.log('Todo updated successfully');
        } else {
            
            //console.error('Failed to update todo');
        }
    };
};

function deleteTodo(todo_id) {
    var form = document.getElementById("complete_todo_form");
    form.action = "/delete_todo/" + todo_id;

     // Delay form submission by 3 seconds (to match toast duration)
     setTimeout(function() {
        form.submit();
    }, 1500);
    
    Toastify({
        text: 'TODO successfully deleted',
        duration: 3000,
        close: true,
        gravity: "top",
        position: "center",
        background: "linear-gradient(to right, #00b09b, #96c93d)",
    }).showToast();

   
};

