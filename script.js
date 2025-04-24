// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyANtNjn4z4ymJLWVRx33RTmEavg1RWRFzQ",
    authDomain: "ivm-6c29e.firebaseapp.com",
    databaseURL: "https://ivm-6c29e-default-rtdb.firebaseio.com",
    projectId: "ivm-6c29e",
    storageBucket: "ivm-6c29e.firebasestorage.app",
    messagingSenderId: "964456986888",
    appId: "1:964456986888:web:591e9a2dafeb3d165a14bd",
    measurementId: "G-K89V5SP378"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global variables
let products = [];
let orders = [];
let lowStockItems = [];

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        document.getElementById('loginButton').classList.add('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        
        // Update user profile information
        const userPhoto = document.getElementById('userPhoto');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        
        userPhoto.src = user.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/default-profile.png';
        userName.textContent = user.displayName || 'User';
        userEmail.textContent = user.email || '';
        
        // Update welcome message
        document.querySelector('.subtitle').textContent = `Welcome, ${user.displayName || 'User'}!`;
        
        console.log("User is signed in:", user);
    } else {
        // User is signed out
        document.getElementById('loginButton').classList.remove('hidden');
        document.getElementById('userInfo').classList.add('hidden');
        document.querySelector('.subtitle').textContent = 'Welcome to your inventory management dashboard';
        console.log("User is signed out");
    }
});

// Google Sign In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            // This gives you a Google Access Token
            const credential = result.credential;
            const token = credential.accessToken;
            // The signed-in user info
            const user = result.user;
            showNotification('Signed in successfully!', 'success');
        })
        .catch((error) => {
            console.error("Error signing in with Google:", error);
            showNotification('Error signing in', 'error');
        });
}

// Sign Out
function signOut() {
    auth.signOut()
        .then(() => {
            showNotification('Signed out successfully!', 'success');
        })
        .catch((error) => {
            console.error("Error signing out:", error);
            showNotification('Error signing out', 'error');
        });
}

// Load products from Firebase when the page loads
function loadProducts() {
    db.collection("products").get()
        .then((querySnapshot) => {
            products = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                products.push({
                    id: doc.id,
                    name: data["product-name"],
                    quantity: data["product-quantity"],
                    price: data["product-price"]
                });
            });
            updateProductList();
            checkLowStock();
            updateLowStockTable();
            updateAnalytics();
        })
        .catch((error) => {
            console.error("Error loading products: ", error);
        });
}

// Check for low stock items and update Firebase
function checkLowStock() {
    const lowStockProducts = products.filter(product => product.quantity < 5);
    
    // Update low stock collection in Firebase
    lowStockProducts.forEach(product => {
        const lowStockData = {
            productId: product.id,
            productName: product.name,
            quantity: product.quantity,
            price: product.price,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Check if product already exists in low stock
        db.collection("low_stock").where("productId", "==", product.id).get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    // Add new low stock item
                    db.collection("low_stock").add(lowStockData)
                        .then(() => {
                            console.log("Low stock item added:", product.name);
                        })
                        .catch((error) => {
                            console.error("Error adding low stock item:", error);
                        });
                } else {
                    // Update existing low stock item
                    querySnapshot.forEach((doc) => {
                        db.collection("low_stock").doc(doc.id).update(lowStockData)
                            .then(() => {
                                console.log("Low stock item updated:", product.name);
                            })
                            .catch((error) => {
                                console.error("Error updating low stock item:", error);
                            });
                    });
                }
            });
    });

    // Remove items from low stock that are no longer low
    db.collection("low_stock").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const lowStockItem = doc.data();
                const product = products.find(p => p.id === lowStockItem.productId);
                
                if (!product || product.quantity >= 5) {
                    db.collection("low_stock").doc(doc.id).delete()
                        .then(() => {
                            console.log("Removed from low stock:", lowStockItem.productName);
                        })
                        .catch((error) => {
                            console.error("Error removing from low stock:", error);
                        });
                }
            });
        });
}

// Load low stock items from Firebase
function loadLowStockItems() {
    db.collection("low_stock").get()
        .then((querySnapshot) => {
            lowStockItems = [];
            querySnapshot.forEach((doc) => {
                lowStockItems.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            updateLowStockTable();
        })
        .catch((error) => {
            console.error("Error loading low stock items:", error);
        });
}

// Load orders from Firebase
function loadOrders() {
    db.collection("orders").get()
        .then((querySnapshot) => {
            orders = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                orders.push({
                    id: doc.id,
                    ...data
                });
            });
            updateOrderList();
        })
        .catch((error) => {
            console.error("Error loading orders: ", error);
        });
}

// Call loadProducts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadOrders();
    loadLowStockItems();
    initializeCharts();
});

function showPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.add("hidden");
    });
    document.getElementById(pageId).classList.remove("hidden");
    
    // Update active state in sidebar
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.sidebar a[onclick="showPage('${pageId}')"]`).classList.add('active');
    
    // Load data based on page
    if (pageId === 'products') {
        loadProducts();
    } else if (pageId === 'orders') {
        loadOrders();
    } else if (pageId === 'analytics') {
        updateAnalytics();
    }
}

// Login Form
function showLoginScreen() {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("dashboard").classList.add("hidden");
}

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    // Simple login check (replace with Firebase Authentication later)
    if (username === "admin" && password === "password") {
        isLoggedIn = true;  // Set user to logged in
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");
    } else {
        alert("Incorrect username or password");
    }
}

function addProduct() {
    let name = document.getElementById("productName").value.trim();
    let quantity = parseInt(document.getElementById("productQuantity").value.trim());
    let price = parseFloat(document.getElementById("productPrice").value.trim());

    if (name && !isNaN(quantity) && !isNaN(price)) {
        const productData = {
            "product-name": name,
            "product-quantity": quantity,
            "product-price": price,
            "created-at": firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("products").add(productData)
            .then(() => {
                loadProducts();
                document.getElementById("productName").value = "";
                document.getElementById("productQuantity").value = "";
                document.getElementById("productPrice").value = "";
                showNotification('Product added successfully!', 'success');
            })
            .catch((error) => {
                console.error("Error adding product: ", error);
                showNotification('Error adding product', 'error');
            });
    } else {
        showNotification('Please fill all fields correctly', 'error');
    }
}

function updateProductList() {
    let productList = document.getElementById("productList");
    productList.innerHTML = "";
    products.forEach(product => {
        let li = document.createElement("li");
        li.innerHTML = `
            <div class="product-info">
                <span class="product-name">${product.name}</span>
                <span class="product-details">Quantity: ${product.quantity} | Price: $${product.price}</span>
            </div>
            <div class="product-actions">
                <button onclick="editProduct('${product.id}')" class="edit-btn">Edit</button>
                <button onclick="deleteProduct('${product.id}')" class="delete-btn">Delete</button>
            </div>
        `;
        productList.appendChild(li);
    });
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById("productName").value = product.name;
        document.getElementById("productQuantity").value = product.quantity;
        document.getElementById("productPrice").value = product.price;
        
        // Change add button to update button
        const addButton = document.querySelector('.product-form-container button');
        addButton.textContent = 'Update Product';
        addButton.onclick = () => updateProduct(productId);
    }
}

function updateProduct(productId) {
    let name = document.getElementById("productName").value.trim();
    let quantity = parseInt(document.getElementById("productQuantity").value.trim());
    let price = parseFloat(document.getElementById("productPrice").value.trim());

    if (name && !isNaN(quantity) && !isNaN(price)) {
        const productData = {
            "product-name": name,
            "product-quantity": quantity,
            "product-price": price,
            "updated-at": firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("products").doc(productId).update(productData)
            .then(() => {
                loadProducts();
                resetProductForm();
                showNotification('Product updated successfully!', 'success');
            })
            .catch((error) => {
                console.error("Error updating product: ", error);
                showNotification('Error updating product', 'error');
            });
    }
}

function resetProductForm() {
    document.getElementById("productName").value = "";
    document.getElementById("productQuantity").value = "";
    document.getElementById("productPrice").value = "";
    const addButton = document.querySelector('.product-form-container button');
    addButton.textContent = 'Add Product';
    addButton.onclick = addProduct;
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        db.collection("products").doc(productId).delete()
            .then(() => {
                loadProducts();
                showNotification('Product deleted successfully!', 'success');
            })
            .catch((error) => {
                console.error("Error deleting product: ", error);
                showNotification('Error deleting product', 'error');
            });
    }
}

function updateLowStockTable() {
    let lowStockTableBody = document.getElementById("lowStockTable").querySelector("tbody");
    lowStockTableBody.innerHTML = "";
    
    // Use lowStockItems array for display
    lowStockItems.forEach(item => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td><span class="status-badge warning">Low Stock</span></td>
            <td>
                <button onclick="restockProduct('${item.productId}')" class="restock-btn">Restock</button>
            </td>
        `;
        lowStockTableBody.appendChild(row);
    });
}

function restockProduct(productId) {
    const newQuantity = prompt("Enter new quantity:");
    if (newQuantity && !isNaN(newQuantity)) {
        const quantity = parseInt(newQuantity);
        if (quantity >= 5) {
            db.collection("products").doc(productId).update({
                "product-quantity": quantity,
                "updated-at": firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                loadProducts();
                showNotification('Product restocked successfully!', 'success');
            })
            .catch((error) => {
                console.error("Error restocking product:", error);
                showNotification('Error restocking product', 'error');
            });
        } else {
            showNotification('Quantity must be at least 5', 'error');
        }
    }
}

function updateOrderList() {
    let orderTableBody = document.getElementById("orderTable").querySelector("tbody");
    orderTableBody.innerHTML = "";
    
    orders.forEach(order => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
            <td>$${order.total}</td>
        `;
        orderTableBody.appendChild(row);
    });
}

function updateAnalytics() {
    // Update sales chart
    const salesData = calculateSalesData();
    updateSalesChart(salesData);
    
    // Update profit/loss chart
    const profitLossData = calculateProfitLossData();
    updateProfitLossChart(profitLossData);
}

function calculateSalesData() {
    // Calculate sales data from orders
    const monthlySales = {};
    orders.forEach(order => {
        const month = new Date(order.date).getMonth();
        monthlySales[month] = (monthlySales[month] || 0) + order.total;
    });
    
    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        data: Array.from({length: 12}, (_, i) => monthlySales[i] || 0)
    };
}

function calculateProfitLossData() {
    // Calculate profit/loss data
    const monthlyProfit = {};
    const monthlyLoss = {};
    
    orders.forEach(order => {
        const month = new Date(order.date).getMonth();
        if (order.profit > 0) {
            monthlyProfit[month] = (monthlyProfit[month] || 0) + order.profit;
        } else {
            monthlyLoss[month] = (monthlyLoss[month] || 0) + Math.abs(order.profit);
        }
    });
    
    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        profit: Array.from({length: 12}, (_, i) => monthlyProfit[i] || 0),
        loss: Array.from({length: 12}, (_, i) => monthlyLoss[i] || 0)
    };
}

function initializeCharts() {
    const salesCtx = document.getElementById("salesChart").getContext("2d");
    const profitLossCtx = document.getElementById("profitLossChart").getContext("2d");
    
    window.salesChart = new Chart(salesCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Total Sales",
                data: [],
                backgroundColor: "rgba(52, 152, 219, 0.2)",
                borderColor: "#3498db",
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    window.profitLossChart = new Chart(profitLossCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Profit",
                    data: [],
                    borderColor: "green",
                    backgroundColor: "rgba(0, 128, 0, 0.2)",
                    fill: true
                },
                {
                    label: "Loss",
                    data: [],
                    borderColor: "red",
                    backgroundColor: "rgba(255, 0, 0, 0.2)",
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateSalesChart(data) {
    if (window.salesChart) {
        window.salesChart.data.labels = data.labels;
        window.salesChart.data.datasets[0].data = data.data;
        window.salesChart.update();
    }
}

function updateProfitLossChart(data) {
    if (window.profitLossChart) {
        window.profitLossChart.data.labels = data.labels;
        window.profitLossChart.data.datasets[0].data = data.profit;
        window.profitLossChart.data.datasets[1].data = data.loss;
        window.profitLossChart.update();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
  
