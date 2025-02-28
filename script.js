
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.add('hidden');
            });
            document.getElementById(pageId).classList.remove('hidden');
        }

        const products = [];

        function addProduct() {
            let name = document.getElementById("productName").value.trim();
            let quantity = parseInt(document.getElementById("productQuantity").value.trim());

            if (name && !isNaN(quantity)) {
                products.push({ name, quantity });
                updateProductList();
                updateLowStockTable();
                document.getElementById("productName").value = "";
                document.getElementById("productQuantity").value = "";
            }
        }

        function updateProductList() {
            let productList = document.getElementById("productList");
            productList.innerHTML = "";
            products.forEach(product => {
                let li = document.createElement("li");
                li.textContent = `${product.name} (Qty: ${product.quantity})`;
                productList.appendChild(li);
            });
        }

        function updateLowStockTable() {
            let lowStockTableBody = document.getElementById("lowStockTable").querySelector("tbody");
            lowStockTableBody.innerHTML = "";
            let lowStockProducts = products.filter(product => product.quantity < 5);

            lowStockProducts.forEach(product => {
                let row = document.createElement("tr");
                row.innerHTML = `<td>${product.name}</td><td>${product.quantity}</td>`;
                lowStockTableBody.appendChild(row);
            });
        }

        const salesCtx = document.getElementById('salesChart').getContext('2d');
        const profitLossCtx = document.getElementById('profitLossChart').getContext('2d');

        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Total Sales',
                    data: [120, 150, 180, 220, 260, 300],
                    backgroundColor: ''
                }]
            }
        });

        new Chart(profitLossCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Profit',
                        data: [50, 80, 60, 100, 150, 200],
                        borderColor: 'green',
                        backgroundColor: 'rgba(0, 128, 0, 0.2)',
                        fill: true
                    },
                    {
                        label: 'Loss',
                        data: [30, 20, 40, 10, 5, 0],
                        borderColor: 'red',
                        backgroundColor: 'rgba(255, 0, 0, 0.2)',
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
