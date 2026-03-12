#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Constants
#define SHOP_FILE "data/shops.dat"
#define BILL_FILE "data/bills.dat"
#define FIXED_CHARGE 50.0

// Structures
typedef struct {
    int id;
    char shopName[100];
    char ownerName[100];
    char phone[15];
    char address[200];
    char meterNumber[30];
    float lastReading;
} Shop;

typedef struct {
    int shopId;
    float previousReading;
    float currentReading;
    float unitsConsumed;
    float totalAmount;
    char billingDate[20];
    char dueDate[20];
} Bill;

// Function Prototypes
void addShop();
void recordMonthlyReading();
void viewAllShops();
void searchShop();
void deleteShop();
void viewBillHistory();
void calculateBill(float units, float *amount);
void getFormattedDate(char *buffer, int daysToAdd);
float getPreviousReading(int id);
void updateShopReading(int id, float newReading);
void menu();

int main() {
    menu();
    return 0;
}

void menu() {
    int choice;
    while (1) {
        printf("\n====================================================");
        printf("\n   SUPERMARKET ELECTRICITY BILLING SYSTEM");
        printf("\n====================================================");
        printf("\n1. Register New Shop");
        printf("\n2. Record Meter Reading & Generate Bill");
        printf("\n3. View All Registered Shops");
        printf("\n4. Search Shop & Billing History");
        printf("\n5. Delete Shop Record");
        printf("\n6. View All Bill History");
        printf("\n7. Exit");
        printf("\n----------------------------------------------------");
        printf("\nEnter choice: ");
        scanf("%d", &choice);
        getchar(); // clear newline

        switch (choice) {
            case 1: addShop(); break;
            case 2: recordMonthlyReading(); break;
            case 3: viewAllShops(); break;
            case 4: searchShop(); break;
            case 5: deleteShop(); break;
            case 6: viewBillHistory(); break;
            case 7: exit(0);
            default: printf("\nInvalid choice! Try again.");
        }
    }
}

void addShop() {
    FILE *fp = fopen(SHOP_FILE, "ab");
    if (fp == NULL) {
        printf("\nError opening file!");
        return;
    }

    Shop s;
    printf("\n--- SHOP REGISTRATION ---");
    printf("\nEnter Shop ID: ");
    scanf("%d", &s.id);
    getchar();
    printf("Enter Shop Name: ");
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
    printf("\nShop registered successfully!");
}

float getPreviousReading(int id) {
    FILE *fp = fopen(SHOP_FILE, "rb");
    if (fp == NULL) return -1.0;

    Shop s;
    while (fread(&s, sizeof(Shop), 1, fp)) {
        if (s.id == id) {
            fclose(fp);
            return s.lastReading;
        }
    }
    fclose(fp);
    return -1.0;
}

void updateShopReading(int id, float newReading) {
    FILE *fp = fopen(SHOP_FILE, "rb+");
    if (fp == NULL) return;

    Shop s;
    while (fread(&s, sizeof(Shop), 1, fp)) {
        if (s.id == id) {
            s.lastReading = newReading;
            fseek(fp, -(long)sizeof(Shop), SEEK_CUR);
            fwrite(&s, sizeof(Shop), 1, fp);
            break;
        }
    }
    fclose(fp);
}

void recordMonthlyReading() {
    int id;
    printf("\nEnter Shop ID: ");
    scanf("%d", &id);

    float prev = getPreviousReading(id);
    if (prev < 0) {
        printf("\nError: Shop ID %d not found!", id);
        return;
    }

    float current;
    printf("Previous Reading: %.2f kWh", prev);
    printf("\nEnter New Meter Reading: ");
    scanf("%f", &current);

    if (current < prev) {
        printf("\nError: Current reading cannot be less than previous (%.2f)!", prev);
        return;
    }

    Bill b;
    b.shopId = id;
    b.previousReading = prev;
    b.currentReading = current;
    b.unitsConsumed = current - prev;
    calculateBill(b.unitsConsumed, &b.totalAmount);
    getFormattedDate(b.billingDate, 0);
    getFormattedDate(b.dueDate, 15);

    // Update the shop's last reading for next month
    updateShopReading(id, current);

    // Save Bill History
    FILE *bf = fopen(BILL_FILE, "ab");
    fwrite(&b, sizeof(Bill), 1, bf);
    fclose(bf);

    printf("\n--- BILL GENERATED ---");
    printf("\nUnits Consumed : %.2f kWh", b.unitsConsumed);
    printf("\nTotal Amount   : Rs. %.2f", b.totalAmount);
    printf("\nBilling Date   : %s", b.billingDate);
    printf("\nDue Date       : %s", b.dueDate);
    printf("\n----------------------\n");
}

void viewAllShops() {
    FILE *fp = fopen(SHOP_FILE, "rb");
    if (fp == NULL) {
        printf("\nNo shops registered.");
        return;
    }

    Shop s;
    printf("\n%-5s %-20s %-20s %-15s", "ID", "Shop Name", "Owner", "Meter No");
    printf("\n------------------------------------------------------------");
    while (fread(&s, sizeof(Shop), 1, fp)) {
        printf("\n%-5d %-20s %-20s %-15s", s.id, s.shopName, s.ownerName, s.meterNumber);
    }
    fclose(fp);
    printf("\n");
}

void searchShop() {
    int id;
    printf("\nEnter Shop ID to search: ");
    scanf("%d", &id);

    FILE *fp = fopen(SHOP_FILE, "rb");
    Shop s;
    int found = 0;
    while (fread(&s, sizeof(Shop), 1, fp)) {
        if (s.id == id) {
            printf("\n--- SHOP DETAILS ---");
            printf("\nID: %d", s.id);
            printf("\nName: %s", s.shopName);
            printf("\nOwner: %s", s.ownerName);
            printf("\nMeter: %s", s.meterNumber);
            printf("\nCurrent Meter Val: %.2f kWh", s.lastReading);
            found = 1;
            break;
        }
    }
    fclose(fp);

    if (!found) {
        printf("\nShop not found.");
        return;
    }

    printf("\n--- BILLING HISTORY ---");
    FILE *bf = fopen(BILL_FILE, "rb");
    Bill b;
    printf("\n%-12s %-10s %-10s %-10s", "Date", "Units", "Amount", "Due Date");
    while (fread(&b, sizeof(Bill), 1, bf)) {
        if (b.shopId == id) {
            printf("\n%-12s %-10.1f %-10.2f %-10s", b.billingDate, b.unitsConsumed, b.totalAmount, b.dueDate);
        }
    }
    fclose(bf);
    printf("\n");
}

void deleteShop() {
    int id, found = 0;
    printf("\nEnter Shop ID to delete: ");
    scanf("%d", &id);

    FILE *fp = fopen(SHOP_FILE, "rb");
    FILE *temp = fopen("data/temp_shops.dat", "wb");
    if (fp == NULL) return;

    Shop s;
    while (fread(&s, sizeof(Shop), 1, fp)) {
        if (s.id == id) {
            found = 1;
        } else {
            fwrite(&s, sizeof(Shop), 1, temp);
        }
    }
    fclose(fp);
    fclose(temp);

    remove(SHOP_FILE);
    rename("data/temp_shops.dat", SHOP_FILE);

    if (found) printf("\nShop record deleted successfully.");
    else printf("\nShop not found.");
}

void viewBillHistory() {
    FILE *bf = fopen(BILL_FILE, "rb");
    if (bf == NULL) return;

    Bill b;
    printf("\n%-7s %-12s %-10s %-10s", "ShopID", "Date", "Units", "Amount");
    printf("\n-------------------------------------------");
    while (fread(&b, sizeof(Bill), 1, bf)) {
        printf("\n%-7d %-12s %-10.1f %-10.2f", b.shopId, b.billingDate, b.unitsConsumed, b.totalAmount);
    }
    fclose(bf);
    printf("\n");
}

void calculateBill(float units, float *amount) {
    if (units <= 100) *amount = units * 2;
    else if (units <= 300) *amount = (100 * 2) + ((units - 100) * 4);
    else *amount = (100 * 2) + (200 * 4) + ((units - 300) * 6);
    *amount += FIXED_CHARGE;
}

void getFormattedDate(char *buffer, int daysToAdd) {
    time_t t = time(NULL);
    t += (daysToAdd * 24 * 60 * 60);
    struct tm *tm_info = localtime(&t);
    strftime(buffer, 20, "%Y-%m-%d", tm_info);
}
