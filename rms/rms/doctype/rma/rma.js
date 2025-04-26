// Copyright (c) 2025, Anantdv and contributors
// For license information, please see license.txt


frappe.ui.form.on("RMA", {
    customer: function (frm) {
        generateAndSetCustomerPrefix(frm);
    },

    generate_unique_id: function (frm) {
        if (!frm.doc.quantity || frm.doc.quantity <= 0) {
            frappe.throw(__('Quantity must be greater than 0'));
            return;
        }

        if (!frm.doc.customer || frm.doc.customer.length < 2) {
            frappe.throw(__('Customer name must be at least 2 characters long'));
            return;
        }

        frm.clear_table('rma_details');
        generateRMANumbers(frm);
        frm.refresh_field('rma_details');
    },

    refresh: function (frm) {
        if (!frm.is_new() && frm.doc.rma_details && frm.doc.rma_details.length > 0) {
            frm.add_custom_button(__('Go to Batch No'), function () {
                frappe.set_route('List', 'Batch No', {});
                generateBatches(frm);

            });
        }
    },
    rma_features_add: function(frm){
        calculate_total(frm);
    },
    rma_features_remove: function(frm){
        calculate_total(frm);
    }
});

frappe.ui.form.on("RMA Features", {
    quantity: function(frm,cdt,cdn){
        calculate_total(frm);
    }
});

function generateAndSetCustomerPrefix(frm) {
    if (!frm.doc.customer) {
        console.log("No customer selected");
        return;
    }

    const words = frm.doc.customer.split(' ');
    console.log(words);

    if (words.length < 2) {
        console.log("Customer name needs at least two words");
        return;
    }

    let initialPrefix = (words[0][0] + words[1][0]).toUpperCase();
    let alternatePrefix = (words[0][1] + words[1][0]).toUpperCase();
    
    console.log("Initial prefix:", initialPrefix);
    console.log("Alternate prefix:", alternatePrefix);

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "RMA",
            filters: {
                'customer_prefix': initialPrefix,
                'customer': ['!=', frm.doc.customer]
            },
            fields: ["name"]
        },
        callback: function (r) {
            console.log("First call Harpreet (prefix check):", r.message);
            let prefix = initialPrefix;

            if (r.message && r.message.length > 0) {
                prefix = alternatePrefix;
            }

            console.log("Selected prefix:", prefix);
            frm.set_value("customer_prefix", prefix);

            // Get customer's last serial number
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "RMA",
                    filters: {
                        'customer': frm.doc.customer
                    },
                    fields: ["name"],
                    order_by: "creation desc",
                    limit: 1
                },
                callback: function (r) {
                    if (r.message && r.message.length > 0) {
                        frappe.call({
                            method: "frappe.client.get",
                            args: {
                                doctype: "RMA",
                                name: r.message[0].name
                            },
                            callback: function (r) {
                                if (r.message && r.message.rma_details && r.message.rma_details.length > 0) {
                                    const lastRMADetail = r.message.rma_details[r.message.rma_details.length - 1];
                                    const lastSerial = parseInt(lastRMADetail.id.slice(-3));
                                    frm.set_value("last_serial_number", lastSerial);
                                } else {
                                    frm.set_value("last_serial_number", 0);
                                }
                            }
                        });
                    } else {
                        frm.set_value("last_serial_number", 0);
                    }
                }
            });

            // Get global last batch number (across all customers)
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "RMA",
                    fields: ["name"],
                    order_by: "creation desc",
                    limit: 1
                },
                callback: function (r) {
                    if (r.message && r.message.length > 0) {
                        frappe.call({
                            method: "frappe.client.get",
                            args: {
                                doctype: "RMA",
                                name: r.message[0].name
                            },
                            callback: function (r) {
                                if (r.message && r.message.rma_details && r.message.rma_details.length > 0) {
                                    const lastRMADetail = r.message.rma_details[r.message.rma_details.length - 1];
                                    const lastBatchNumber = parseInt(lastRMADetail.batch_no.split('.')[1]);
                                    console.log("Last global batch number found:", lastBatchNumber);
                                    frm.set_value("last_batch_number", lastBatchNumber);
                                } else {
                                    console.log("No RMA details found, setting batch to 0");
                                    frm.set_value("last_batch_number", 0);
                                }
                            }
                        });
                    } else {
                        console.log("No previous RMA found, setting batch to 0");
                        frm.set_value("last_batch_number", 0);
                    }
                }
            });
        }
    });
}

function calculate_total(frm) {
    console.log("Calculating total quantity...");
    let total_qty = 0;

    if (frm.doc.rma_features && frm.doc.rma_features.length) {
        frm.doc.rma_features.forEach(function(row) {
            console.log("Row quantity:", row.quantity);
            total_qty += parseInt(row.quantity || 0);
        });
    }

    frm.set_value('quantity', total_qty);
    frm.refresh_field('quantity');
    console.log("Total quantity calculated:", total_qty);
}

function generateRMANumbers(frm) {
    const prefix = frm.doc.customer_prefix;
    const lastSerialNumber = frm.doc.last_serial_number || 0;
    const lastBatchNumber = frm.doc.last_batch_number || 0;
    
    console.log("Generating RMA numbers with:", {
        prefix: prefix,
        lastSerialNumber: lastSerialNumber,
        lastBatchNumber: lastBatchNumber
    });
    
    if (!prefix) {
        frappe.throw(__('Customer prefix not generated. Please check the customer name.'));
        return;
    }

    // Quantities for batches
    let batchQuantities = [];
    if (frm.doc.rma_features && frm.doc.rma_features.length) {
        batchQuantities = frm.doc.rma_features.map(row => parseInt(row.quantity || 0));
    }

    let currentBatchIndex = 0;
    let currentBatch = lastBatchNumber + 1;
    let processedInCurrentBatch = 0;
    let currentBatchQuantity = batchQuantities[0] || 0;
    
    for(let i = 1; i <= frm.doc.quantity; i++) {
        const currentNumber = lastSerialNumber + i;
        const serialNum = String(currentNumber).padStart(3, '0');
        const randomPart = generateRandomChars(3);  
        const rmaNumber = `${prefix}${randomPart}${serialNum}`;

        //  BA.#### format
        const batchNum = `BA.${String(currentBatch).padStart(4, '0')}`;

        const child = frm.add_child('rma_details');
        child.id = rmaNumber;
        child.status = 'Active';
        child.batch_no = batchNum;
        
        processedInCurrentBatch++;
        
        // Check if we've completed the current batch
        if (processedInCurrentBatch === currentBatchQuantity) {
            currentBatchIndex++;
            if (currentBatchIndex < batchQuantities.length) {
                currentBatch++;
                processedInCurrentBatch = 0;
                currentBatchQuantity = batchQuantities[currentBatchIndex];
            }
        }
        
        console.log(`Generated RMA number: ${rmaNumber} with batch: ${batchNum}`);
    }
}

function generateRandomChars(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateBatches(frm) {

    let items_by_batch = [];

    frm.doc.rma_details.forEach(item => {
        if(!items_by_batch[item.batch_no]){
            items_by_batch[item.batch_no] = [];
        }
        items_by_batch[item.batch_no].push(item);
    });

    console.log("Items grouped by batch:", items_by_batch);

    for(let batch_no in items_by_batch){
        let batch_doc = frappe.model.get_new_doc('Batch No');
        console.log("harpreet", batch_doc)
        batch_doc.batch_name = batch_no;
        batch_doc.customer = frm.doc.customer;
        batch_doc.rma_no = [];

        items_by_batch[batch_no].forEach(item => {
            batch_doc.rma_no.push({
                doctype: 'Batch No List',
                rma_no:item.id,
                batch_no:item.batch_no
            })
        });
        frappe.db.insert(batch_doc)
            .then(() => {
                console.log(`Batch document created for batch: ${batch_no}`);
                frappe.show_alert({
                    message: `Batch document created for ${batch_no}`,
                    indicator: 'green'
                });
            })
            .catch(err => {
                console.error(`Error creating Batch document for batch: ${batch_no}`, err);
                frappe.throw(`Error creating Batch document: ${err}`);
            });
    }
}






