// Copyright (c) 2025, Anantdv and contributors
// For license information, please see license.txt

// frappe.ui.form.on("RMA", {
//   // after_workflow_action: function (frm) {
//   //   if (frm.doc.workflow_state === "Serial No. Generated" && frm.doc.batch_generated === 0) {
//   //           // updateBatchSerialNumbers(frm);
//   //       }
//   //   frm.set_df_property('rma_details', 'cannot_add_rows', true);
    
//   // },
 
//   customer: function (frm) {
//     generateAndSetCustomerPrefix(frm);
    // frm.set_query("material_receipt", () => {
    //   return {
    //     filters: {
    //       customer: frm.doc.customer,
    //       isrma: 0,
    //     },
    //   };
    // });
//   },

//   onload: function (frm) {
//     console.log("Onlodad Evenet Triggered");
//     // frm.set_df_property("rma_details", "cannot_add_rows", true);
//     // Create a map to cache item names based on unit_type
//     frm.item_name_map = {};

//     // Go through each row in the child table
//     (frm.doc.rma_features || []).forEach((row) => {
//       if (row.unit_type) {
//         // Fetch item_name for each unit_type
//         frappe.db.get_value("Item", row.unit_type, "item_name").then((r) => {
//           if (r && r.message) {
//             // Store in map
//             frm.item_name_map[row.unit_type] = r.message.item_name;
//             // Refresh child table to update display
//             frm.refresh_field("rma_features");
//           }
//         });
//       }
//     });

//     // Filter rma_features to show only rows with created batches
//     filterRMAFeaturesWithCreatedBatches(frm);
//   },



//   rma_features_add: function (frm) {
//     calculate_total(frm);
//   },
//   rma_features_remove: function (frm) {
//     calculate_total(frm);
//   },
// });

// frappe.ui.form.on("RMA Features", {
//   quantity: function (frm, cdt, cdn) {
//     calculate_total(frm);
//   },
//   unit_type: async function (frm, cdt, cdn) {
//     let row = locals[cdt][cdn];

//     console.log("first", row.unit_type);
//     let is_stock_item = await frappe.db
//       .get_value("Item", row.unit_type, "has_serial_no")
//       .then((r) => {
//         console.log("second", r);
//         if (r.message && r.message.has_serial_no) {
//           frm.set_df_property(
//             "rma_features",
//             "read_only",
//             1,
//             frm.docname,
//             "isbulk",
//             row.name
//           );
//         }
//       })
//       .catch((err) => {
//         console.error("Error fetching item data:", err);
//         return false;
//       });
//     console.log("third", is_stock_item);
//   },
// });


// function generateAndSetCustomerPrefix(frm) {
//   if (!frm.doc.customer) {
//     console.log("No customer selected");
//     return;
//   }

//   const words = frm.doc.customer.split(" ");
//   console.log(words);

//   if (words.length < 2) {
//     console.log("Customer name needs at least two words");
//     return;
//   }

//   let initialPrefix = (words[0][0] + words[1][0]).toUpperCase();
//   let alternatePrefix = (words[0][1] + words[1][0]).toUpperCase();

//   console.log("Initial prefix:", initialPrefix);
//   console.log("Alternate prefix:", alternatePrefix);

//   frappe.call({
//     method: "frappe.client.get_list",
//     args: {
//       doctype: "RMA",
//       filters: {
//         customer_prefix: initialPrefix,
//         customer: ["!=", frm.doc.customer],
//       },
//       fields: ["name"],
//     },
//     callback: function (r) {
//       console.log("First call Harpreet (prefix check):", r.message);
//       let prefix = initialPrefix;

//       if (r.message && r.message.length > 0) {
//         prefix = alternatePrefix;
//       }

//       console.log("Selected prefix:", prefix);
//       frm.set_value("customer_prefix", prefix);

//       // Get customer's last serial number
//       frappe.call({
//         method: "frappe.client.get_list",
//         args: {
//           doctype: "RMA",
//           filters: {
//             customer: frm.doc.customer,
//           },
//           fields: ["name"],
//           order_by: "creation desc",
//           limit: 1,
//         },
//         callback: function (r) {
//           if (r.message && r.message.length > 0) {
//             frappe.call({
//               method: "frappe.client.get",
//               args: {
//                 doctype: "RMA",
//                 name: r.message[0].name,
//               },
//               callback: function (r) {
//                 if (
//                   r.message &&
//                   r.message.rma_details &&
//                   r.message.rma_details.length > 0
//                 ) {
//                   const lastRMADetail =
//                     r.message.rma_details[r.message.rma_details.length - 1];
//                   const lastSerial = parseInt(lastRMADetail.id.slice(-3));
//                   frm.set_value("last_serial_number", lastSerial);
//                 } else {
//                   frm.set_value("last_serial_number", 0);
//                 }
//               },
//             });
//           } else {
//             frm.set_value("last_serial_number", 0);
//           }
//         },
//       });

//       // Get global last batch number (across all customers)
//       frappe.call({
//         method: "frappe.client.get_list",
//         args: {
//           doctype: "RMA",
//           fields: ["name"],
//           order_by: "creation desc",
//           limit: 1,
//         },
//         callback: function (r) {
//           if (r.message && r.message.length > 0) {
//             frappe.call({
//               method: "frappe.client.get",
//               args: {
//                 doctype: "RMA",
//                 name: r.message[0].name,
//               },
//               callback: function (r) {
//                 if (
//                   r.message &&
//                   r.message.rma_details &&
//                   r.message.rma_details.length > 0
//                 ) {
//                   let lastRMADetail =
//                     r.message.rma_details[r.message.rma_details.length - 1];
//                   let lastBatchNumber = parseInt(
//                     lastRMADetail.batch_no.split(".")[1]
//                   );
//                   console.log(
//                     "Last global batch number found:",
//                     lastBatchNumber
//                   );
//                   frm.set_value("last_batch_number", lastBatchNumber);
//                 } else {
//                   console.log("No RMA details found, setting batch to 0");
//                   frm.set_value("last_batch_number", 0);
//                 }
//               },
//             });
//           } else {
//             console.log("No previous RMA found, setting batch to 0");
//             frm.set_value("last_batch_number", 0);
//           }
//         },
//       });
//     },
//   });
// }

// async function updateSingleBatch(frm, batchNo, rmaNo, rmaItem, serialNumber) {
//     try {
//         // Use Frappe's call method to get batch document
//         let response = await frappe.call({
//             method: 'frappe.client.get',
//             args: {
//                 doctype: 'Batch',
//                 name: batchNo
//             }
//         });

//         let batchDoc = response.message;
//         frm.doc.name = batchDoc.custom_rma_id;

//         let found = false;

//         if (batchDoc.custom_rma_no ) {
//             for (let row of batchDoc.custom_rma_no) {
//                 if (row.rma_no === rmaNo) {
//                     row.serial_no = serialNumber;
//                     found = true;
//                     break;
//                 }
//             }
//         }

//         if (found) {
//             // Save the updated batch document
//             await frappe.call({
//                 method: 'frappe.client.save',
//                 args: {
//                     doc: batchDoc
//                 }
//             });

          

//             // Commit the transaction
//             // await frappe.call({
//             //     method: 'frappe.db.commit'
//             // });


            
//         }
//     } catch (error) {
//         frappe.msgprint({
//             title: __('Error'),
//             indicator: 'red',
//             message: __('Error updating batch: {0}', [error.message])
//         });
//         console.error("Error updating batch:", error);
//     }
// }

// function calculate_total(frm) {
//   console.log("Calculating total quantity...");
//   let total_qty = 0;

//   if (frm.doc.rma_features && frm.doc.rma_features.length) {
//     frm.doc.rma_features.forEach(function (row) {
//       console.log("Row quantity:", row.quantity);
//       total_qty += parseInt(row.quantity || 0);
//     });
//   }

//   frm.set_value("quantity", total_qty);
//   frm.refresh_field("quantity");
//   console.log("Total quantity calculated:", total_qty);
// }

// function generateRMANumbers(frm) {
//   const prefix = frm.doc.customer_prefix;
//   const lastSerialNumber = frm.doc.last_serial_number || 0;

//   console.log("Generating RMA numbers with:", {
//     prefix: prefix,
//     lastSerialNumber: lastSerialNumber,
//   });

//   if (!prefix) {
//     frappe.throw(
//       __("Customer prefix not generated. Please check the customer name.")
//     );
//     return;
//   }

//   // Quantities for batches
//   let batchQuantities = [];
//   let unitTypes = [];

//   if (frm.doc.rma_features && frm.doc.rma_features.length) {
//     frm.doc.rma_features.forEach((row) => {
//       batchQuantities.push(parseInt(row.quantity || 0));
//       unitTypes.push(row.unit_type || "");
//     });
//   }

//   // Find next available batch numbers
//   findNextAvailableBatchNumbers(frm, batchQuantities.length, (availableBatchNumbers) => {
//     let currentBatchIndex = 0;
//     let currentBatch = availableBatchNumbers[currentBatchIndex];
//     let processedInCurrentBatch = 0;
//     let currentBatchQuantity = batchQuantities[0] || 0;
//     let currentUnitType = unitTypes[0] || "";

//     for (let i = 1; i <= frm.doc.quantity; i++) {
//       const currentNumber = lastSerialNumber + i;
//       const serialNum = String(currentNumber).padStart(3, "0");
//       const randomPart = generateRandomChars(3);
//       const rmaNumber = `${prefix}${randomPart}${serialNum}`;

//       //  BA.#### format
//       const batchNum = `BA.${String(currentBatch).padStart(4, "0")}`;

//       const child = frm.add_child("rma_details");
//       child.id = rmaNumber;
//       child.status = "Active";
//       child.batch_no = batchNum;
//       child.unit_type = currentUnitType;

//       processedInCurrentBatch++;

//       // Check if we've completed the current batch
//       if (processedInCurrentBatch === currentBatchQuantity) {
//         currentBatchIndex++;
//         if (currentBatchIndex < batchQuantities.length) {
//           currentBatch = availableBatchNumbers[currentBatchIndex];
//           processedInCurrentBatch = 0;
//           currentBatchQuantity = batchQuantities[currentBatchIndex];
//           currentUnitType = unitTypes[currentBatchIndex];
//         }
//       }

//       console.log(`Generated RMA number: ${rmaNumber} with batch: ${batchNum}`);
//     }

//     frm.refresh_field("rma_details");
//     generateBatches(frm);
    
// // frm.dirty();
// // frm.save()
//   });
// }

// function generateRandomChars(length) {
//   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let result = "";
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// }

// function findNextAvailableBatchNumbers(frm, requiredBatches, callback) {
//   console.log("Finding next available batch numbers, required:", requiredBatches);
  
//   // Get all existing batch numbers from the Batch doctype
//   frappe.call({
//     method: "frappe.client.get_list",
//     args: {
//       doctype: "Batch",
//       fields: ["batch_id"],
//       order_by: "batch_id desc",
//       limit: 1000 // Get a reasonable number of recent batches
//     },
//     callback: function (r) {
//       let existingBatchNumbers = [];
      
//       if (r.message && r.message.length > 0) {
//         existingBatchNumbers = r.message
//           .map(batch => {
//             if (batch.batch_id && batch.batch_id.startsWith("BA.")) {
//               return parseInt(batch.batch_id.split(".")[1]);
//             }
//             return null;
//           })
//           .filter(num => num !== null);
//       }
      
//       console.log("Existing batch numbers:", existingBatchNumbers);
      
//       // Find the highest existing batch number
//       let highestBatchNumber = existingBatchNumbers.length > 0 ? Math.max(...existingBatchNumbers) : 0;
//       console.log("Highest existing batch number:", highestBatchNumber);
      
//       // Generate available batch numbers
//       let availableBatchNumbers = [];
//       let currentNumber = highestBatchNumber + 1;
      
//       while (availableBatchNumbers.length < requiredBatches) {
//         let batchId = `BA.${String(currentNumber).padStart(4, "0")}`;
        
//         // Check if this batch number already exists
//         if (!existingBatchNumbers.includes(currentNumber)) {
//           availableBatchNumbers.push(currentNumber);
//         }
//         currentNumber++;
//       }
      
//       console.log("Available batch numbers:", availableBatchNumbers);
//       callback(availableBatchNumbers);
//     }
//   });
// }

// function generateBatches(frm) {
//     // Step 1: Map item types to quantities
//     let items_map = {};
//     if (frm.doc.rma_features && frm.doc.rma_features.length) {
//         frm.doc.rma_features.forEach(feature => {
//             items_map[feature.unit_type] = {
//                 quantity: parseInt(feature.quantity || 0),
//                 isbulk: feature.isbulk
//             };
//         });
//     }
//     console.log("Items map:", items_map);

//     // Step 2: Group RMA IDs by batch number
//     let items_by_batch = {};
//     frm.doc.rma_details.forEach(item => {
//         if (!items_by_batch[item.batch_no]) {
//             items_by_batch[item.batch_no] = [];
//         }
//         items_by_batch[item.batch_no].push(item);
//     });

//     let completed_batches = 0;
//     let batch_exists_count = 0;
//     console.log("Items grouped by batch:", items_by_batch);

//     // Step 3: Map batch numbers to unit types from rma_features
//     let batch_to_item_mapping = {};
//     let batchNumbers = Object.keys(items_by_batch).sort();
//     frm.doc.rma_features.forEach((feature, index) => {
//         if (batchNumbers[index]) {
//             batch_to_item_mapping[batchNumbers[index]] = {
//                 item_code: feature.unit_type,
//                 quantity: parseInt(feature.quantity || 0),
//                 isbulk: feature.isbulk
//             };
//         }
//     });

//     console.log("Batch to item mapping:", batch_to_item_mapping);

//     // Step 4: Create Batch documents
//     let total_batches = Object.keys(items_by_batch).length;
    
//     for (let batch_no in items_by_batch) {
//         frappe.db.exists('Batch', batch_no).then(exists => {
//             console.log("Batch existence check for", batch_no, ":", exists);
            
//             if (exists) {
//                 batch_exists_count++;
//                 console.log(`Batch already exists for: ${batch_no}, skipping creation.`);
                
//                 // Check if all batches already exist
//                 if (batch_exists_count === total_batches) {
//                     // Show error message and trigger page refresh
//                     frappe.msgprint({
//                         title: __("Batches Already Exist"),
//                         message: __("All batches for this RMA already exist. Please refresh the page to see the updated data."),
//                         indicator: 'red',
//                         primary_action: {
//                             label: __('Refresh Page'),
//                             action: function() {
//                                 window.location.reload();
//                             }
//                         }
//                     });
//                 }
//                 return;
//             }

//             let batch_doc = frappe.model.get_new_doc('Batch');
//             console.log("Creating Batch for:", batch_no);

//             batch_doc.custom_customer = frm.doc.customer;
//             batch_doc.batch_name = batch_no;
//             batch_doc.batch_id = batch_no;
//             batch_doc.id = batch_no;

//             // Add item and quantity from rma_features
//             if (batch_to_item_mapping[batch_no]) {
//                 console.log("Batch to item mapping found for:", batch_to_item_mapping[batch_no]?.isbulk);
//                 batch_doc.item = batch_to_item_mapping[batch_no].item_code;
//                 batch_doc.custom_is_bulk = batch_to_item_mapping[batch_no]?.isbulk;
//                 batch_doc.custom_total_quantity = batch_to_item_mapping[batch_no].quantity;
//                 batch_doc.batch_qty = batch_to_item_mapping[batch_no].quantity;
//             }

//             batch_doc.custom_rma_no = [];
//             items_by_batch[batch_no].forEach(item => {
//                 batch_doc.custom_rma_no.push({
//                     doctype: 'Batch No List',
//                     rma_no: item.id,
//                     batch_no: item.batch_no,
//                     serial_no: item.sl_no
//                 });
//             });

//             frappe.db.insert(batch_doc)
//             .then(() => {
//                 console.log(`✅ Batch created for: ${batch_no}`);
//                 completed_batches++;
                
//                 frappe.show_alert({
//                     message: `✅ Batch created for ${batch_no}`,
//                     indicator: 'green'
//                 });

//                 // If all new batches are created, filter the rma_features table
//                 if (completed_batches === (total_batches - batch_exists_count)) {
//                     setTimeout(() => {
//                         filterRMAFeaturesWithCreatedBatches(frm);
//                     }, 1000);
//                 }
//             })
//             .catch(err => {
//                 console.error("❌ Error object:", err);
//                 frappe.msgprint({
//                     title: "Batch Creation Failed",
//                     message: `An error occurred while creating batch ${batch_no}. Check console for details.`,
//                     indicator: 'red'
//                 });
//             });
//         });
//     }

//     frm.set_df_property("rma_details", "cannot_add_rows", true);
//     frm.set_value("guic", 1);
//     frm.refresh_field("guic");
//     frm.dirty();
//     frm.save();
//     frm.reload_doc();
    
// }

// function filterRMAFeaturesWithCreatedBatches(frm) {
//     if (!frm.doc.rma_details || frm.doc.rma_details.length === 0) {
//         return;
//     }

//     // Get all unique batch numbers from rma_details
//     let batch_numbers = [...new Set(frm.doc.rma_details.map(item => item.batch_no))];
    
//     // Map batch numbers to unit types from rma_details
//     let batch_to_unit_type = {};
//     frm.doc.rma_details.forEach(item => {
//         if (!batch_to_unit_type[item.batch_no] && item.unit_type) {
//             batch_to_unit_type[item.batch_no] = item.unit_type;
//         }
//     });

//     let created_batches = [];
//     let checks_completed = 0;

//     batch_numbers.forEach(batch_no => {
//         frappe.db.exists('Batch', batch_no).then(exists => {
//             checks_completed++;
            
//             if (exists) {
//                 created_batches.push(batch_no);
//             }

//             // When all checks are completed, filter the table
//             if (checks_completed === batch_numbers.length) {
//                 filterRMAFeaturesTable(frm, created_batches, batch_to_unit_type);
//             }
//         });
//     });
// }

// function filterRMAFeaturesTable(frm, created_batches, batch_to_unit_type) {
//     if (!frm.doc.rma_features || created_batches.length === 0) {
//         return;
//     }

//     // Get unit types that have created batches
//     let unit_types_with_batches = created_batches.map(batch => batch_to_unit_type[batch]).filter(Boolean);
    
//     // Filter rma_features to show only rows with created batches
//     let filtered_features = frm.doc.rma_features.filter(feature => 
//         unit_types_with_batches.includes(feature.unit_type)
//     );

//     // Clear and repopulate the table
//     frm.clear_table("rma_features");
    
//     filtered_features.forEach(feature => {
//         let child = frm.add_child("rma_features");
//         Object.keys(feature).forEach(key => {
//             if (key !== 'name' && key !== 'doctype' && key !== 'parenttype' && key !== 'parentfield' && key !== 'parent') {
//                 child[key] = feature[key];
//             }
//         });
//     });

//     frm.refresh_field("rma_features");
    
//     if (filtered_features.length < frm.doc.rma_features.length) {
//         frappe.show_alert({
//             message: `Showing only ${filtered_features.length} rows with created batches`,
//             indicator: 'blue'
//         });
//     }
// }

// frappe.ui.form.on("RMA", {
//   generate_unique_id: function (frm) {
//     if (!frm.doc.quantity || frm.doc.quantity <= 0) {
//       frappe.throw(__("Quantity must be greater than 0"));
//       return;
//     }

//     if (!frm.doc.customer || frm.doc.customer.length < 2) {
//       frappe.throw(__("Customer name must be at least 2 characters long"));
//       return;
//     }

//     // Check if RMA details already exist and if batches have been created
//     if (frm.doc.rma_details && frm.doc.rma_details.length > 0) {
//       // Get unique batch numbers from existing RMA details
//       let existing_batch_numbers = [...new Set(frm.doc.rma_details.map(item => item.batch_no))];
      
//       if (existing_batch_numbers.length > 0) {
//         // Check if any of these batches exist in the Batch doctype
//         let batch_checks = existing_batch_numbers.map(batch_no => 
//           frappe.db.exists('Batch', batch_no)
//         );
        
//         Promise.all(batch_checks).then(results => {
//           let existing_batches_count = results.filter(exists => exists).length;
          
//           if (existing_batches_count > 0) {
//             // Show message with only refresh page option
//             frappe.msgprint({
//               title: __("Batches Already Created"),
//               message: __(`${existing_batches_count} batches have already been created for this RMA. 
//                          <br><br>Please refresh the page to see the current data.`),
//               indicator: 'red',
//               primary_action: {
//                 label: __('Refresh Page'),
//                 action: function() {
//                   window.location.reload();
//                 }
//               }
//             });
//           } else {
//             // No batches exist yet, proceed normally
//             proceedWithGeneration(frm);
//           }
//         }).catch(err => {
//           console.error("Error checking batch existence:", err);
//           // Proceed anyway if check fails
//           proceedWithGeneration(frm);
//         });
//       } else {
//         // No batch numbers found, proceed normally
//         proceedWithGeneration(frm);
//       }
//     } else {
//       // No existing RMA details, proceed normally
//       proceedWithGeneration(frm);
//     }
//   }
// });

// function proceedWithGeneration(frm) {
//   frm.clear_table("rma_details");
//   generateRMANumbers(frm);
 
// }

// frappe.form.link_formatters["Item"] = function (value, doc) {
//   if (!value) {
//     return "";
//   }
//   let name_map = cur_frm.item_name_map || {};
//   let item_name = name_map[doc.unit_type] || "";
//   return value + (item_name ? ": " + item_name : "");
// };







// frappe.ui.form.on("RMA", {

//   onload: function(frm) {
//         if (!frm.doc.date) {
//             frm.set_value('date', frappe.datetime.get_today());
//         }

//           frm.set_query("warehouse", () => {
//       return {
//         filters: {
//           company: "Ductus Technologies Pvt. Ltd.",
//         },
//       };
//     });
//     },

// validate: function(frm) {
    
//     const hasRmaId = frm.doc.rma_features?.some(row => row.rma_id);

//     if (!hasRmaId) {
//         frappe.throw("Generate RMA ID's before proceeding");
//     }
// },

//   customer: function (frm) {
//     generateAndSetCustomerPrefix(frm);
//   },

//   rma_features_add: function (frm) {
//     calculate_total(frm);
//   },
  
//   rma_features_remove: function (frm) {
//     calculate_total(frm);
//   },

//   generate_unique_id: function (frm) {
//     if (!frm.doc.rma_features || frm.doc.rma_features.length === 0) {
//       frappe.throw(__("Please add at least one part in RMA Features"));
//       return;
//     }

//     if (!frm.doc.customer || frm.doc.customer.length < 2) {
//       frappe.throw(__("Customer name must be at least 2 characters long"));
//       return;
//     }

//     // Check if there are any rows with model values
//     let rowsWithModel = frm.doc.rma_features.filter(feature => feature.model);
//     if (rowsWithModel.length === 0) {
//       frappe.throw(__("Please add Model in at least one row before generating RMA IDs"));
//       return;
//     }

//     generateRMANumbers(frm);
//   },

//   refresh: function(frm) {
//     console.log("RMA form refreshed", frm.doc);
//     frm.set_query("model", "rma_features", function() {
//       return {
//         filters: {
//           "item_group": "Products",
//         }
//       };
//     });
 
   
//     // frm.set_query("part_no", "rma_features", function() {
//     //   return {
//     //     filters: {
//     //       "item_group": "Components",

//     //     }
//     //   };
//     // });
// frm.set_query("part_no", "rma_features", function(doc, cdt, cdn) {
//         let child = locals[cdt][cdn];
//         return {
//             filters: {
//                 item_group: "Components",
//                 model_no: child.model || ""
//             }
//         };
//     });
//      frm.set_query("repair_status", "rma_features", function() {
//             return {
//                 filters: {
//                     name: "Hold"
//                 }
//             };
//         });
//   }
// });

// function generateAndSetCustomerPrefix(frm) {
//   if (!frm.doc.customer) {
//     console.log("No customer selected");
//     return;
//   }

//   const words = frm.doc.customer.split(" ");
  
//   if (words.length < 2) {
//     console.log("Customer name needs at least two words");
//     return;
//   }

//   let initialPrefix = (words[0][0] + words[1][0]).toUpperCase();
//   let alternatePrefix = (words[0][1] + words[1][0]).toUpperCase();

//   frappe.call({
//     method: "frappe.client.get_list",
//     args: {
//       doctype: "RMA",
//       filters: {
//         customer_prefix: initialPrefix,
//         customer: ["!=", frm.doc.customer],
//       },
//       fields: ["name"],
//     },
//     callback: function (r) {
//       let prefix = initialPrefix;

//       if (r.message && r.message.length > 0) {
//         prefix = alternatePrefix;
//       }

//       frm.set_value("customer_prefix", prefix);
//     },
//   });
// }

// function calculate_total(frm) {
//   // Quantity is now based on the number of rows in rma_features
//   let total_qty = 0;

//   if (frm.doc.rma_features && frm.doc.rma_features.length) {
//     total_qty = frm.doc.rma_features.length;
//   }

//   frm.set_value("quantity", total_qty);
//   frm.refresh_field("quantity");
//   console.log("Total quantity calculated based on rows:", total_qty);
// }

// // function generateRMANumbers(frm) {
// //   const prefix = frm.doc.customer_prefix;

// //   if (!prefix) {
// //     frappe.throw(__("Customer prefix not generated. Please check the customer name."));
// //     return;
// //   }

// //   let generatedCount = 0;
// //   let skippedCount = 0;
// //   let serialCounter = 1;

// //   // Generate RMA ID only for rows that have a model value
// //   frm.doc.rma_features.forEach((feature, index) => {
// //     // Check if this row has a model value
// //     if (feature.model) {
// //       const serialNum = String(serialCounter).padStart(3, "0");
// //       const randomPart = generateRandomChars(3);
// //       const rmaNumber = `${prefix}${randomPart}${serialNum}`;
      
// //       // Set the RMA ID in the rma_id field
// //       feature.rma_id = rmaNumber;
// //       generatedCount++;
// //       serialCounter++;
// //     } else {
// //       // Clear any existing RMA ID for rows without model
// //       feature.rma_id = "";
// //       skippedCount++;
// //       console.log(`Row ${index + 1}: Skipped RMA ID generation (no model selected)`);
// //     }
// //   });

// //   frm.refresh_field("rma_features");
  
// //   // Show summary message
// //   let message = `Generated ${generatedCount} RMA IDs successfully!`;
// //   if (skippedCount > 0) {
// //     message += ` (Skipped ${skippedCount} rows without model)`;
// //   }
  
// //   frappe.show_alert({
// //     message: message,
// //     indicator: 'green'
// //   });
  
// //   frm.dirty();
// //   frm.save();
// // }


// function generateRMANumbers(frm) {
//   const prefix = frm.doc.customer_prefix;

//   if (!prefix) {
//     frappe.throw(__("Customer prefix not generated. Please check the customer name."));
//     return;
//   }

//   let generatedCount = 0;
//   let skippedCount = 0;
//   let alreadyExistCount = 0;
//   let serialCounter = 1;

//   // Generate RMA ID only for rows that have a model value AND don't already have an RMA ID
//   frm.doc.rma_features.forEach((feature, index) => {
//     // Check if this row has a model value
//     if (feature.model) {
//       // Check if RMA ID already exists
//       if (feature.rma_id && feature.rma_id.trim() !== "") {
//         // RMA ID already exists, skip generation
//         alreadyExistCount++;
//         console.log(`Row ${index + 1}: RMA ID already exists (${feature.rma_id})`);
//       } else {
//         // Generate new RMA ID
//         const serialNum = String(serialCounter).padStart(3, "0");
//         const randomPart = generateRandomChars(3);
//         const rmaNumber = `${prefix}${randomPart}${serialNum}`;
        
//         // Set the RMA ID in the rma_id field
//         feature.rma_id = rmaNumber;
//         generatedCount++;
//         console.log(`Row ${index + 1}: Generated new RMA ID (${rmaNumber})`);
//       }
//       serialCounter++;
//     } else {
//       // Clear any existing RMA ID for rows without model
//       feature.rma_id = "";
//       skippedCount++;
//       console.log(`Row ${index + 1}: Skipped RMA ID generation (no model selected)`);
//     }
//   });

//   frm.refresh_field("rma_features");
  
//   // Show summary message
//   let message = "";
//   if (generatedCount > 0) {
//     message += `Generated ${generatedCount} new RMA IDs successfully!`;
//   }
//   if (alreadyExistCount > 0) {
//     if (message) message += " ";
//     message += `${alreadyExistCount} RMA IDs already existed.`;
//   }
//   if (skippedCount > 0) {
//     if (message) message += " ";
//     message += `Skipped ${skippedCount} rows without model.`;
//   }
  
//   if (generatedCount === 0 && alreadyExistCount > 0) {
//     message = "All rows with models already have RMA IDs generated.";
//   }
  
//   frappe.show_alert({
//     message: message,
//     indicator: generatedCount > 0 ? 'green' : 'orange'
//   });
  
//   if (generatedCount > 0) {
//     frm.dirty();
//     frm.save();
//   }
// }

// function generateRandomChars(length) {
//   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let result = "";
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// }

// frappe.ui.form.on('RMA Features', {
//     model: function(frm, cdt, cdn) {
//         let child = locals[cdt][cdn];   
//         if (child.model) {           
//             frappe.db.get_value('Item', child.model, 'make')
//                 .then(r => {
//                     if (r.message && r.message.make) {
//                       //  console.log("Fetched make from Item:", r.message.make);
//                         frappe.model.set_value(cdt, cdn, 'brand', r.message.make);
//                     }
//                 });
//         }

        
//     },
// });

frappe.ui.form.on("RMA", {

  onload: function(frm) {
        // REMOVED automatic date setting - date will be set on submission
        // if (!frm.doc.date) {
        //     frm.set_value('date', frappe.datetime.get_today());
        // }

        frm.set_query("warehouse", () => {
            return {
                filters: {
                    company: "Ductus Technologies Pvt. Ltd.",
                },
            };
        });
    },

validate: function(frm) {
    
    const hasRmaId = frm.doc.rma_features?.some(row => row.rma_id);

    if (!hasRmaId) {
        frappe.throw("Generate RMA ID's before proceeding");
    }
},

  customer: function (frm) {
    generateAndSetCustomerPrefix(frm);
  },

  rma_features_add: function (frm) {
    calculate_total(frm);
  },
  
  rma_features_remove: function (frm) {
    calculate_total(frm);
  },

  generate_unique_id: function (frm) {
    if (!frm.doc.rma_features || frm.doc.rma_features.length === 0) {
      frappe.throw(__("Please add at least one part in RMA Features"));
      return;
    }

    if (!frm.doc.customer || frm.doc.customer.length < 2) {
      frappe.throw(__("Customer name must be at least 2 characters long"));
      return;
    }

    // Check if there are any rows with model values
    let rowsWithModel = frm.doc.rma_features.filter(feature => feature.model);
    if (rowsWithModel.length === 0) {
      frappe.throw(__("Please add Model in at least one row before generating RMA IDs"));
      return;
    }

    generateRMANumbers(frm);
  },

  refresh: function(frm) {
    console.log("RMA form refreshed", frm.doc);
    
    // Show date information if document is draft
    if(frm.doc.docstatus === 0 && !frm.doc.date) {
        frm.set_intro("Date will be set automatically when the document is submitted", "blue");
    }
    
    frm.set_query("model", "rma_features", function() {
      return {
        filters: {
          "item_group": "Products",
        }
      };
    });
 
    frm.set_query("part_no", "rma_features", function(doc, cdt, cdn) {
        let child = locals[cdt][cdn];
        return {
            filters: {
                item_group: "Components",
                model_no: child.model || ""
            }
        };
    });
    
    frm.set_query("repair_status", "rma_features", function() {
        return {
            filters: {
                name: "Hold"
            }
        };
    });
  }
});

function generateAndSetCustomerPrefix(frm) {
  if (!frm.doc.customer) {
    console.log("No customer selected");
    return;
  }

  const words = frm.doc.customer.split(" ");
  
  if (words.length < 2) {
    console.log("Customer name needs at least two words");
    return;
  }

  let initialPrefix = (words[0][0] + words[1][0]).toUpperCase();
  let alternatePrefix = (words[0][1] + words[1][0]).toUpperCase();

  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "RMA",
      filters: {
        customer_prefix: initialPrefix,
        customer: ["!=", frm.doc.customer],
      },
      fields: ["name"],
    },
    callback: function (r) {
      let prefix = initialPrefix;

      if (r.message && r.message.length > 0) {
        prefix = alternatePrefix;
      }

      frm.set_value("customer_prefix", prefix);
    },
  });
}

function calculate_total(frm) {
  // Quantity is now based on the number of rows in rma_features
  let total_qty = 0;

  if (frm.doc.rma_features && frm.doc.rma_features.length) {
    total_qty = frm.doc.rma_features.length;
  }

  frm.set_value("quantity", total_qty);
  frm.refresh_field("quantity");
  console.log("Total quantity calculated based on rows:", total_qty);
}

function generateRMANumbers(frm) {
  const prefix = frm.doc.customer_prefix;

  if (!prefix) {
    frappe.throw(__("Customer prefix not generated. Please check the customer name."));
    return;
  }

  let generatedCount = 0;
  let skippedCount = 0;
  let alreadyExistCount = 0;
  let serialCounter = 1;

  // Generate RMA ID only for rows that have a model value AND don't already have an RMA ID
  frm.doc.rma_features.forEach((feature, index) => {
    // Check if this row has a model value
    if (feature.model) {
      // Check if RMA ID already exists
      if (feature.rma_id && feature.rma_id.trim() !== "") {
        // RMA ID already exists, skip generation
        alreadyExistCount++;
        console.log(`Row ${index + 1}: RMA ID already exists (${feature.rma_id})`);
      } else {
        // Generate new RMA ID
        const serialNum = String(serialCounter).padStart(3, "0");
        const randomPart = generateRandomChars(3);
        const rmaNumber = `${prefix}${randomPart}${serialNum}`;
        
        // Set the RMA ID in the rma_id field
        feature.rma_id = rmaNumber;
        generatedCount++;
        console.log(`Row ${index + 1}: Generated new RMA ID (${rmaNumber})`);
      }
      serialCounter++;
    } else {
      // Clear any existing RMA ID for rows without model
      feature.rma_id = "";
      skippedCount++;
      console.log(`Row ${index + 1}: Skipped RMA ID generation (no model selected)`);
    }
  });

  frm.refresh_field("rma_features");
  
  // Show summary message
  let message = "";
  if (generatedCount > 0) {
    message += `Generated ${generatedCount} new RMA IDs successfully!`;
  }
  if (alreadyExistCount > 0) {
    if (message) message += " ";
    message += `${alreadyExistCount} RMA IDs already existed.`;
  }
  if (skippedCount > 0) {
    if (message) message += " ";
    message += `Skipped ${skippedCount} rows without model.`;
  }
  
  if (generatedCount === 0 && alreadyExistCount > 0) {
    message = "All rows with models already have RMA IDs generated.";
  }
  
  frappe.show_alert({
    message: message,
    indicator: generatedCount > 0 ? 'green' : 'orange'
  });
  
  if (generatedCount > 0) {
    frm.dirty();
    frm.save();
  }
}

function generateRandomChars(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

frappe.ui.form.on('RMA Features', {
    model: function(frm, cdt, cdn) {
        let child = locals[cdt][cdn];   
        if (child.model) {           
            frappe.db.get_value('Item', child.model, 'make')
                .then(r => {
                    if (r.message && r.message.make) {
                        frappe.model.set_value(cdt, cdn, 'brand', r.message.make);
                    }
                });
        }
    },
});