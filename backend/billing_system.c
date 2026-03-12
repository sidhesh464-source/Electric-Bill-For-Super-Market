#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Constants
#define SHOP_FILE "data/shop.dat"
#define BILL_FILE "data/bills.dat"
#define FIXED_CHARGE 50.0

// Structures
typedef struct {
    char shopName[100];
    char ownerName[100];
    char phone[15];
    char address[200];
    char meterNumber[30];
    float lastReading;
} Shop;

typedef struct {
    float previousReading;
    float currentReading;
    float unitsConsumed;
    float totalAmount;
    char billingDate[20];
    char dueDate[20];
} Bill;

// Function Prototypes
void registerShop();
void recordMonthlyReading();
void viewShopDetails();
void viewBillHistory();
void calculateBill(float units, float *amount);
void getFormattedDate(char *buffer, int daysToAdd);
void menu();

int main() {
    menu();
    return 0;
}

void menu() {
    int choice;
    while (1) {
        printf("\n====================================================");
        printf("\n   SUPERMARKET ELECTRICITY BILLING - SINGLE SHOP");
        printf("\n====================================================");
        printf("\n1. Shop Registration (Setup)");
        printf("\n2. Enter New Monthly Meter Reading");
        printf("\n3. View Shop Details");
        printf("\n4. View Monthly Bill History");
        printf("\n5. Exit");
        printf("\n----------------------------------------------------");
        printf("\nEnter choice: ");
        scanf("%d", &choice);
        getchar(); // clear newline

        switch (choice) {
            case 1: registerShop(); break;
            case 2: recordMonthlyReading(); break;
            case 3: viewShopDetails(); break;
            case 4: viewBillHistory(); break;
            case 5: exit(0);
            default: printf("\nInvalid choice! Try again.");
        }
    }
}

void registerShop() {
    FILE *fp = fopen(SHOP_FILE, "wb"); // 'wb' to ensure only one shop exists (overwrite setup)
    if (fp == NULL) {
        printf("\nError opening file!");
        return;
    }

    Shop s;
    printf("\n--- SHOP REGISTRATION ---");
    printf("\nEnter Shop Name: ");
    fgets(s.shopName, 100, stdin); s.shopName[strcspn(s.shopName, "\n")] = 0;
    printf("Enter Owner Name: ");
    fgets(s.ownerName, 100, stdin); s.ownerName[strcspn(s.ownerName, "\n")] = 0;
    printf("Enter Phone Number: ");
    fgets(s.phone, 15, stdin); s.phone[strcspn(s.phone, "\n")] = 0;
    printf("Enter Shop Address: ");
    fgets(s.address, 200, stdin); s.address[strcspn(s.address, "\n")] = 0;
    printf("Enter Meter Number: ");
    fgets(s.meterNumber, 30, stdin); s.meterNumber[strcspn(s.meterNumber, "\n")] = 0;
    printf("Enter Initial Meter Reading: ");
    scanf("%f", &s.lastReading);

    fwrite(&s, sizeof(Shop), 1, fp);
    fclose(fp);
    printf("\nShop setup successful!");
}

void recordMonthlyReading() {
    FILE *fp = fopen(SHOP_FILE, "rb+");
    if (fp == NULL) {
        printf("\nNo shop found! Please register the shop first (Option 1).");
        return;
    }

    Shop s;
    fread(&s, sizeof(Shop), 1, fp);

    float current;
    printf("\n--- MONTHLY METER ENTRY ---");
    printf("\nShop: %s", s.shopName);
    printf("\nPrevious Reading: %.2f kWh", s.lastReading);
    printf("\nEnter New Meter Reading: ");
    scanf("%f", &current);

    if (current < s.lastReading) {
        printf("\nError: Current reading cannot be less than previous reading (%.2f)!", s.lastReading);
        fclose(fp);
        return;
    }

    Bill b;
    b.previousReading = s.lastReading;
    b.currentReading = current;
    b.unitsConsumed = current - s.lastReading;
    calculateBill(b.unitsConsumed, &b.totalAmount);
    getFormattedDate(b.billingDate, 0);
    getFormattedDate(b.dueDate, 15);

    // Update shop's last reading
    s.lastReading = current;
    rewind(fp);
    fwrite(&s, sizeof(Shop), 1, fp);
    fclose(fp);

    // Save Bill History
    FILE *bf = fopen(BILL_FILE, "ab");
    fwrite(&b, sizeof(Bill), 1, bf);
    fclose(bf);

    printf("\n--- BILL GENERATED ---");
    printf("\nShop Name      : %s", s.shopName);
    printf("\nMeter Number   : %s", s.meterNumber);
    printf("\nUnits Consumed : %.2f kWh", b.unitsConsumed);
    printf("\nTotal Amount   : Rs. %.2f", b.totalAmount);
    printf("\nBilling Date   : %s", b.billingDate);
    printf("\nDue Date       : %s", b.dueDate);
    printf("\n----------------------\n");
}

void viewShopDetails() {
    FILE *fp = fopen(SHOP_FILE, "rb");
    if (fp == NULL) {
        printf("\nNo shop registered.");
        return;
    }

    Shop s;
    fread(&s, sizeof(Shop), 1, fp);
    printf("\n--- REGISTERED SHOP DETAILS ---");
    printf("\nShop Name    : %s", s.shopName);
    printf("\nOwner        : %s", s.ownerName);
    printf("\nPhone        : %s", s.phone);
    printf("\nAddress      : %s", s.address);
    printf("\nMeter No     : %s", s.meterNumber);
    printf("\nCurrent Rd   : %.2f kWh", s.lastReading);
    printf("\n--------------------------------\n");
    fclose(fp);
}

void viewBillHistory() {
    FILE *bf = fopen(BILL_FILE, "rb");
    if (bf == NULL) {
        printf("\nNo bill history recorded.");
        return;
    }

    Bill b;
    printf("\n%-12s %-10s %-10s %-10s %-10s", "Date", "Prev", "Curr", "Units", "Amount");
    printf("\n-----------------------------------------------------------");
    while (fread(&b, sizeof(Bill), 1, bf)) {
        printf("\n%-12s %-10.1f %-10.1f %-10.1f %-10.2f", b.billingDate, b.previousReading, b.currentReading, b.unitsConsumed, b.totalAmount);
    }
    fclose(bf);
    printf("\n");
}

void calculateBill(float units, float *amount) {
    if (units <= 100) {
        *amount = units * 2;
    } else if (units <= 300) {
        *amount = (100 * 2) + ((units - 100) * 4);
    } else {
        *amount = (100 * 2) + (200 * 4) + ((units - 300) * 6);
    }
    *amount += FIXED_CHARGE;
}

void getFormattedDate(char *buffer, int daysToAdd) {
    time_t t = time(NULL);
    t += (daysToAdd * 24 * 60 * 60);
    struct tm *tm_info = localtime(&t);
    strftime(buffer, 20, "%Y-%m-%d", tm_info);
}
