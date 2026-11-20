import java.util.Scanner;

/* ---------- Custom exceptions ---------- */
class BakeryItemNotFoundException extends Exception {
    BakeryItemNotFoundException(int id) {
        super("Item id " + id + " is not on the menu. Pick an id from 101 to 106.");
    }
}

class InsufficientStockException extends Exception {
    InsufficientStockException(BakeryItem it, int want) {
        super("Only " + it.stock + " " + it.name + " left, but " + want + " requested. Order rejected and stock unchanged.");
    }
}

/* ---------- Menu item ---------- */
class BakeryItem {
    static final int LOW_LIMIT = 10;
    int id, stock;
    String name, category;
    double price;

    BakeryItem(int id, String name, String category, double price, int stock) {
        this.id = id; this.name = name; this.category = category; this.price = price; this.stock = stock;
    }

    String status() { return stock < LOW_LIMIT ? "LOW" : "OK"; }   // ?: operator
}

/* ---------- Inheritance + abstraction ---------- */
class Person {
    String name;
    Person(String name) { this.name = name; }
}

abstract class Customer extends Person {
    Customer(String name) { super(name); }
    abstract double getDiscountRate();
    abstract String getType();
}

class Regular extends Customer {
    Regular(String n) { super(n); }
    double getDiscountRate() { return 0.0; }
    String getType() { return "Regular"; }
}

class Loyalty extends Customer {
    Loyalty(String n) { super(n); }
    double getDiscountRate() { return 0.10; }
    String getType() { return "Loyalty"; }
}

/* ---------- Own stack (array based, used for undo) ---------- */
class OrderLine {
    BakeryItem item; int qty;
    OrderLine(BakeryItem item, int qty) { this.item = item; this.qty = qty; }
}

class ItemStack {
    private OrderLine[] data = new OrderLine[50];
    private int top = -1;
    void push(OrderLine x) { data[++top] = x; }
    OrderLine pop() { return top < 0 ? null : data[top--]; }
    boolean isEmpty() { return top < 0; }
    int size() { return top + 1; }
    OrderLine get(int i) { return data[i]; }
}

/* ---------- Order ---------- */
class Order {
    static final double GST = 0.05;
    static int counter = 0;
    String id;
    Customer customer;
    OrderLine[] lines;
    int token, shelf;

    Order(Customer c, OrderLine[] lines, int token) {
        this.id = "ORD" + (++counter);
        this.customer = c; this.lines = lines; this.token = token;
        this.shelf = (token & 1) == 1 ? 1 : 2;            // odd -> Shelf 1, even -> Shelf 2
    }

    double subtotal(int i) {                               // recursion
        return i >= lines.length ? 0 : lines[i].item.price * lines[i].qty + subtotal(i + 1);
    }
    double subtotal() { return subtotal(0); }              // overloading
    double discount() { return subtotal() * customer.getDiscountRate(); }
    double gst() { return (subtotal() - discount()) * GST; }
    double total() { return subtotal() - discount() + gst(); }

    void printBill() {
        System.out.println("\n===== CrustCraft Bakery =====");
        System.out.println(id + " | " + customer.name + " (" + customer.getType() + ")");
        System.out.println("Token: " + token + "   Collect from Shelf " + shelf);
        System.out.println("-----------------------------");
        for (OrderLine l : lines)
            System.out.printf("%d x %-22s %9.2f%n", l.qty, l.item.name, l.item.price * l.qty);
        System.out.println("-----------------------------");
        System.out.printf("Subtotal            %13.2f%n", subtotal());
        System.out.printf("Discount (%2.0f%%)      %13.2f%n", customer.getDiscountRate() * 100, -discount());
        System.out.printf("GST 5%%              %13.2f%n", gst());
        System.out.printf("TOTAL               %13.2f%n", total());
        System.out.println("=============================\n");
    }
}

/* ---------- Main app ---------- */
public class CrustCraft {
    static BakeryItem[] menu = {
        new BakeryItem(101, "Black Forest Pastry", "Pastry", 70, 24),
        new BakeryItem(102, "Chocolate Cake 500 g", "Cake", 450, 8),
        new BakeryItem(103, "Veg Puff", "Snack", 25, 40),
        new BakeryItem(104, "Brown Bread", "Bread", 45, 20),
        new BakeryItem(105, "Butter Cookies 200 g", "Cookies", 120, 15),
        new BakeryItem(106, "Plum Cake 250 g", "Cake", 180, 10)
    };
    static Order[] orders = new Order[100];
    static int orderCount = 0, tokenCounter = 1;
    static Scanner sc = new Scanner(System.in);

    static BakeryItem findItem(int id) throws BakeryItemNotFoundException {
        for (BakeryItem m : menu) if (m.id == id) return m;
        throw new BakeryItemNotFoundException(id);
    }

    static int qtyInStack(ItemStack s, int id) {
        int q = 0;
        for (int i = 0; i < s.size(); i++) if (s.get(i).item.id == id) q += s.get(i).qty;
        return q;
    }

    // overloaded validate: id only, or id + quantity
    static BakeryItem validate(int id) throws BakeryItemNotFoundException { return findItem(id); }
    static BakeryItem validate(ItemStack s, int id, int qty) throws BakeryItemNotFoundException, InsufficientStockException {
        BakeryItem it = findItem(id);
        int want = qtyInStack(s, id) + qty;
        if (want > it.stock) throw new InsufficientStockException(it, want);
        return it;
    }

    static int readInt(String prompt) {
        System.out.print(prompt);
        while (!sc.hasNextInt()) { sc.next(); System.out.print("Enter a whole number: "); }
        return sc.nextInt();
    }

    static void showMenu() {
        System.out.printf("%n%-5s %-22s %-8s %8s %6s %s%n", "Id", "Item", "Category", "Price", "Stock", "Status");
        for (BakeryItem m : menu)
            System.out.printf("%-5d %-22s %-8s %8.2f %6d %s%n", m.id, m.name, m.category, m.price, m.stock, m.status());
    }

    static void newOrder() {
        sc.nextLine();
        System.out.print("Customer name: ");
        String name = sc.nextLine().trim();
        if (name.isEmpty()) { System.out.println("Name is required."); return; }
        int t = readInt("Type (1 = Regular, 2 = Loyalty): ");
        Customer c = (t == 2) ? new Loyalty(name) : new Regular(name);

        ItemStack stack = new ItemStack();
        while (true) {
            int id = readInt("Item id (0 = finish, -1 = undo last): ");
            if (id == 0) break;
            if (id == -1) {
                OrderLine x = stack.pop();
                System.out.println(x == null ? "Nothing to undo." : "Removed " + x.qty + " x " + x.item.name);
                continue;
            }
            int qty = readInt("Quantity: ");
            try {
                if (qty <= 0) throw new IllegalArgumentException("Quantity must be greater than 0.");
                stack.push(new OrderLine(validate(stack, id, qty), qty));
                System.out.println("Added.");
            } catch (BakeryItemNotFoundException | InsufficientStockException | IllegalArgumentException e) {
                System.out.println("Error: " + e.getMessage());
            } finally {
                System.out.println("(" + stack.size() + " line(s) in basket)");
            }
        }
        if (stack.isEmpty()) { System.out.println("Empty order discarded."); return; }

        OrderLine[] lines = new OrderLine[stack.size()];
        for (int i = 0; i < lines.length; i++) lines[i] = stack.get(i);
        for (OrderLine l : lines) l.item.stock -= l.qty;      // stock changes only after all checks passed
        Order o = new Order(c, lines, tokenCounter++);
        orders[orderCount++] = o;
        o.printBill();
    }

    static void viewBill() {
        System.out.print("Order id (e.g. ORD1): ");
        String id = sc.next().trim().toUpperCase();
        for (int i = 0; i < orderCount; i++)
            if (orders[i].id.equals(id)) { orders[i].printBill(); return; }
        System.out.println("No bill found for " + id);
    }

    static void report() {
        double rev = 0;
        int[] cnt = new int[menu.length];
        for (int i = 0; i < orderCount; i++) {
            rev += orders[i].total();
            for (OrderLine l : orders[i].lines)
                for (int k = 0; k < menu.length; k++) if (menu[k] == l.item) cnt[k] += l.qty;
        }
        System.out.println("\nOrders: " + orderCount + "   Revenue: " + String.format("%.2f", rev));
        for (int k = 0; k < menu.length; k++) System.out.println(menu[k].name + ": " + cnt[k] + " sold");
    }

    public static void main(String[] args) {
        while (true) {
            System.out.println("\n1 Menu  2 New order  3 View bill  4 Sales report  5 Exit");
            int ch = readInt("Choose: ");
            switch (ch) {
                case 1: showMenu(); break;
                case 2: newOrder(); break;
                case 3: viewBill(); break;
                case 4: report(); break;
                case 5: System.out.println("Shift closed. Thanks for baking today."); return;
                default: System.out.println("Pick 1 to 5.");
            }
        }
    }
}
