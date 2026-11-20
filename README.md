# CrustCraft – Bakery Counter Billing

CrustCraft is a bakery counter billing project built around a simple bakery menu, customer orders, discounts, GST calculations, receipts, and sales reporting.

The repository contains two separate implementations:

- **Web interface:** HTML, CSS, and JavaScript for an interactive browser-based bakery counter.
- **Java console application:** A Java implementation of the bakery billing workflow.

> The web interface and Java console application currently run independently. The website is a static frontend; it does not call the Java program as a backend.

## Project files

```text
CrustCraft/
├── CrustCraft – Bakery Counter Billing.html
├── CrustCraft.java
├── index.html
├── script.js
├── style.css
├── README.md
└── AI_LOG.txt
```

## Features

### Web interface

- Bakery menu with item IDs, categories, prices, and stock status
- Regular and Loyalty customer selection
- Add items to an order and undo the last added item
- Subtotal, loyalty discount, GST, and final bill calculation
- Order receipts with order IDs, tokens, and collection shelves
- Search for previously generated bills
- Sales summary
- Responsive layout and light/dark theme support

### Java console application

- Menu display and order entry
- Regular and Loyalty customer types
- 10% Loyalty discount and 5% GST
- Order IDs and odd/even token shelf assignment
- Undo support using a custom array-based stack
- Custom exceptions for unknown item IDs and insufficient stock
- Bill lookup and sales reporting

## Bakery menu

| ID | Item | Category | Price | Initial stock |
|---:|---|---|---:|---:|
| 101 | Black Forest Pastry | Pastry | ₹70 | 24 |
| 102 | Chocolate Cake 500 g | Cake | ₹450 | 8 |
| 103 | Veg Puff | Snack | ₹25 | 40 |
| 104 | Brown Bread | Bread | ₹45 | 20 |
| 105 | Butter Cookies 200 g | Cookies | ₹120 | 15 |
| 106 | Plum Cake 250 g | Cake | ₹180 | 10 |

## Billing rules

- Regular customer discount: **0%**
- Loyalty customer discount: **10%**
- GST: **5%**, applied to the amount after discount

```text
Subtotal       = Sum of (item price × quantity)
Discount       = Subtotal × discount rate
Taxable amount = Subtotal − Discount
GST            = Taxable amount × 0.05
Final total    = Taxable amount + GST
```

## Run the web interface locally

Keep `index.html`, `style.css`, and `script.js` in the same folder.

1. Open the project folder in Visual Studio Code.
2. Open `index.html` in a browser, or use the VS Code Live Server extension.
3. Use the navigation to view the menu, create orders, view bills, and see the report.

The web interface is static and does not require a build command.

## Run the Java console application

Install **JDK 17 or later**, then open a terminal in the project folder.

Compile:

```bash
javac CrustCraft.java
```

Run:

```bash
java CrustCraft
```

The Java application runs in the terminal and is separate from the deployed website.

## Deploy the website

The static web interface can be deployed using GitHub Pages or Vercel.

- **GitHub Pages:** Configure Pages in the repository settings and publish from the branch/folder containing `index.html`.
- **Vercel:** Import the GitHub repository and deploy it as a static site. If the files are in the repository root, use `.` as the project root and leave the build command empty.

Only the static web interface is deployed by this process. The Java console application is stored in the repository but is not turned into a web backend.

## Important notes

- The browser application's order data is held in the page's JavaScript runtime. It is not a shared database and may reset when the page is reloaded.
- The Java console application and web interface maintain separate data; orders entered in one are not visible in the other.
- Review and test both implementations before presenting or submitting the project.
- If a course or hackathon rubric requires particular Java constructs, verify each requirement against the final Java source rather than assuming that every requirement is covered.

## Author

Add your name, team details, and contact or portfolio links here before publishing.
