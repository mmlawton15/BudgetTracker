//create a variable to hold db connection
let db;
//stablish connection to indexeddb database and set it to version 1
const request = indexedDB.open('bankTransaction_db', 1);

//emit if the database version changes
request.onupgradeneeded = function(event) {
    //safe reference to database
    let db = event.target.result;
    //create object store (table) called 'new_Banktransaction', set auto incrementing primary key
    db.createObjectStore('new_bankTransaction', {autoIncrement: true});
}
//upon successful
request.onsuccess = function(event) {
    //when db is successfully create with wits object store (from onupgradeneeded)
    db = event.target.result;

    //check if app is online, if yes run uploadBankTransaction() function to send all local db dta to api
    if (navigator.online) {
        uploadBankTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//function to execute if we attempt to submit a new bankTransaction
function saveRecord(record) {
    //open a new transaction with the database with read and write permissions
    console.log('!!!!!!!!!!!!!',db)
    const transaction = db.transaction(['new_bankTransaction'], 'readwrite');

    //access the object store for new transaction
    const bankTransactionObjectStore = transaction.objectStore('new_bankTransaction');

    //add record to your store with add method
    bankTransactionObjectStore.add(record);
}

function uploadBankTransaction() {
    //open a transaction on my db
    const transaction = db.transaction(['new_bankTransaction'], 'readwrite');
    //access object store
    const bankTransactionObjectStore = transaction.objectStore('new_bankTransaction');
    //get all recrods from store and set to a variable
    const getAll = bankTransactionObjectStore.getAll();

    //upon a successful .getall execution, run this
    getAll.onsuccess = function() {
        //if there was data in indexdbs store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_bankTransaction'], 'readwrite');
                //access the new_bankTransaction object store
                const bankTransactionObjectStore = transaction.objectStore('new_bankTransaction');
                bankTransactionObjectStore.clear();

                alert ('All bank transactions have been submitted successfully!')
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

//listen for app coming back online
window.addEventListener('online', uploadBankTransaction);