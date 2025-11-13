
// // Copyright (c) 2025, Anantdv and contributors
// // For license information, please see license.txt

// frappe.ui.form.on('Repair and Return Technician View', {
//     refresh: function (frm) {
//         console.log("refresh called")
        
//         // Fix the field label display
//         if (frm.fields_dict.repair_and_return && frm.fields_dict.repair_and_return.grid) {
//             // Update the column header label
//             setTimeout(() => {
//                 let $header = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="component_used"]');
//                 if ($header.length) {
//                     $header.html('Component Used'); // Set proper header text without styling
//                 }
//             }, 1000);
//         }

//         // set_current_technician(frm);

//         if (frm.custom_buttons["Get Data"]) {
//             frm.remove_custom_button("Get Data");
//         }

//         frm.add_custom_button(__('Get Data'), function () {
//             load_technician_rma_data(frm);
//         }).addClass('btn-primary');

//         frm.add_custom_button(__('Create Material Receipt'), function () {
//             // Get ALL repair_and_return items that have components (no filter for existing material receipts)
//             let items_with_components = frm.doc.repair_and_return.filter(item => 
//                 item.component_used && 
//                 item.component_used.trim() !== ''
//             );
            
//             // Check if there are any items to process
//             if (items_with_components.length === 0) {
//                 frappe.msgprint(__('No items found with components'));
//                 return;
//             }
            
//             let rma_ids = items_with_components.map(item => item.rma_id).join(', ');
//             console.log("All rma ids with components..", rma_ids);
//             let components = []
            
//             items_with_components.forEach((row) => {
//                 if(row.component_used) {
//                     row.component_used.split(", ").forEach(r => {
//                         components.push(r)
//                     })

//                     frappe.call({
//                         method: 'frappe.client.set_value',
//                         args: {
//                             doctype: 'RMA BIN',
//                             name: row.rma_id,
//                             fieldname: {
//                                 'component_used': row.component_used,
//                                 'fault_found': row.fault_found,
//                                 'repaired_date': row.assigned_date,
//                                 'repair_remarks': row.repair_remarks,
//                                 'rma_id_status': row.repair_status 
//                             }
//                         },
//                         callback: function (update_response) {
//                             frappe.db.get_doc('RMA BIN', row.rma_id).then(doc => {
//                                 console.log("Fetched RMA BIN:", doc);

//                                 // Ensure remarks child table exists
//                                 if (!doc.remarks) {
//                                     doc.remarks = [];
//                                 }

//                                 // Add a new child row manually
//                                 doc.remarks.push({
//                                     repair_remarks: row.repair_remarks,
//                                     timestamp: frappe.datetime.now_datetime()
//                                 });

//                                 if (!doc.rma_status) {
//                                     doc.rma_status = [];
//                                 }

//                                 doc.rma_status.push({
//                                     repair_status: row.repair_status,
//                                     timestamp: frappe.datetime.now_datetime()
//                                 });

//                                 // Save the updated document back
//                                 frappe.call({
//                                     method: 'frappe.client.save',
//                                     args: {
//                                         doc: doc
//                                     },
//                                     callback: function (save_response) {
//                                         // Success callback
//                                     }
//                                 });
//                             });

//                             // Show success message for RMA BIN update
//                             frappe.show_alert({
//                                 message: __('Components saved to RMA BIN: ' + row.rma_id),
//                                 indicator: 'green'
//                             });
//                         },
//                         error: function (err) {
//                             console.error("Error updating RMA BIN:", err);
//                             frappe.msgprint(__('Error updating RMA BIN with components: ' + (err.message || err)));
//                         }
//                     });
//                 }
//             })

//             console.log("components", components)

//             // Fetch item details for the components
//             frappe.call({
//                 method: 'frappe.client.get_list',
//                 args: {
//                     doctype: 'Item',
//                     filters: {
//                         'item_name': ['in', components]
//                     },
//                     fields: ['name', 'item_name', 'item_code', 'stock_uom', 'description', 'valuation_rate']
//                 },
//                 callback: function(response) {
//                     if (!response.message || response.message.length === 0) {
//                         frappe.msgprint(__('Could not fetch component details'));
//                         return;
//                     }
                    
//                     console.log("Components fetched:", response.message);
                    
//                     let items_to_add = response.message;
                    
//                     frappe.new_doc('Stock Entry', {
//                         stock_entry_type: 'Material Transfer',
//                         custom_technician: frm.doc.technician,
//                         purpose: 'Material Transfer',
//                         custom_customer: items_with_components[0].customer, // Use first item's customer
//                         custom_rma_id: rma_ids  
//                     }, doc => {
                        
//                         setTimeout(() => {
//                             // Get the current form
//                             let se_frm = cur_frm;
                            
//                             // Clear any existing items
//                             se_frm.clear_table('items');
                            
//                             // Add each component as a row
//                             items_to_add.forEach(function(item) {
//                                 let row = se_frm.add_child('items');
//                                 row.item_code = item.name;
//                                 row.item_name = item.item_name;
//                                 row.description = item.description || item.item_name;
//                                 row.uom = item.stock_uom || 'Nos';
//                                 row.stock_uom = item.stock_uom || 'Nos';
//                                 row.s_warehouse = 'Finished Goods - DTPL';  // Source warehouse
//                                 row.t_warehouse = 'Repair Floor - DTPL';    // Target warehouse
//                                 row.conversion_factor = 1;
//                                 row.qty = 1; // Default quantity - user can change this
//                                 row.transfer_qty = 1;
//                                 row.basic_rate = item.valuation_rate || 0;
//                             });
                            
//                             // Refresh the items field to show the new rows
//                             se_frm.refresh_field('items');
                            
//                             frappe.show_alert({
//                                 message: __('Material Transfer created with ' + items_to_add.length + ' components for ' + items_with_components.length + ' RMA IDs'),
//                                 indicator: 'blue'
//                             });
//                         }, 500); // Small delay to ensure form is fully loaded
//                     });
//                 },
//                 error: function(err) {
//                     console.error("Error details:", err);
//                     frappe.msgprint(__('Error fetching component details'));
//                 }
//             });
//         }).addClass('btn-primary');

//         setup_field_filters(frm);
        
//         // Apply component pills formatting after data load
//         setTimeout(() => {
//             format_components_as_pills(frm);
//         }, 1000);
//     },

//     customer: function (frm) {
//         if (frm.doc.lot_no) {
//             frm.set_value('lot_no', '');
//         }
//     },

//     onload_post_render: function (frm) {
//         console.log("onload post render")
//         set_current_technician(frm);
//         frm.set_value("lot_no", "")
//         frm.set_value("customer", "")
//         frm.set_value("circle", "")
//         frm.set_value("warranty_status", "")
//         frm.clear_table("repair_and_return");
//         frm.refresh_field("repair_and_return")
//         // frm.save()
//     },

//      before_save: async function (frm) {
//         let oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");
//         let local_storage_val = []

//         for (let row of frm.doc.repair_and_return) {
//             let original = oldData.find(o => o.rma_id === row.rma_id);
//             if (!original) continue;

//             let hasSimpleChange = false;
//             let updates = {};

//             function normalize(val) {
//                 if (val === undefined || val === null) return "";
//                 return val;
//             }

//             if (normalize(row.repair_status) !== normalize(original.rma_id_status)) {
//                 updates.rma_id_status = row.repair_status;
//                 hasSimpleChange = true
//             }

//             if (normalize(row.fault_found) !== normalize(original.fault_found)) {
//                 console.log("fault_found changes", row.fault_found, original.fault_found);
//                 updates.fault_found = row.fault_found;
//                 hasSimpleChange = true;
//             }

//             if(normalize(row.assigned_date) !== normalize(original.repaired_date)){
//                 updates.repaired_date = row.assigned_date
//                 hasSimpleChange = true
//             }

//             let hasRepairStatusChanged = normalize(row.repair_status) !== normalize(original?.rma_id_status);

//             // Check remarks (child table in RMA BIN)
//             let remarksChanged = row.repair_remarks !== original.remarks[original.remarks.length - 1]?.repair_remarks;

//             console.log("Updates for RMA", row.rma_id, ":", updates);

//             // Push updates for simple fields
//             if (hasSimpleChange) {
//                 await frappe.db.set_value("RMA BIN", row.rma_id, updates);
//             }

//             // Handle remarks separately (child table)
//             if (remarksChanged) {
//                 let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                 // Replace the last remark or append new
//                 rmaDoc.remarks.push({
//                     repair_remarks: row.repair_remarks,
//                     timestamp: frappe.datetime.now_datetime()
//                 });
//                 rmaDoc.last_updated_on = frappe.datetime.now_datetime();
//                 await frappe.call({
//                     method: "frappe.client.save",
//                     args: { doc: rmaDoc }
//                 });
//             }

//             // console.log("Repair status changed for RMA", row.rma_id, "from", original?.rma_id_status, "to", row.repair_status);
//             if (hasRepairStatusChanged) {
//                 let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                 // Replace the last remark or append new
//                 rmaDoc.rma_status.push({
//                     repair_status: row.repair_status,
//                     timestamp: frappe.datetime.now_datetime()
//                 });
//                 rmaDoc.last_updated_on = frappe.datetime.now_datetime();
//                 await frappe.call({
//                     method: "frappe.client.save",
//                     args: { doc: rmaDoc }
//                 });
//             }

//             const rma_bin_data = await frappe.db.get_doc("RMA BIN", row.rma_id);
//             local_storage_val.push(rma_bin_data)
//         }

//         localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(local_storage_val));

//         // Update snapshot after save
//         // localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(frm.doc.repair_and_return));
//         // load_technician_rma_data(frm)
//     }
// });

// // Updated Function to format components as pills with remove functionality
// function format_components_as_pills(frm) {
//     // Add custom CSS for pills with improved styling
//     if (!$('#component-pills-css').length) {
//         $('head').append(`
//             <style id="component-pills-css">
//                 .component-pill {
//                     display: inline-block;
//                     background-color: #007bff;
//                     color: white;
//                     padding: 2px 8px 2px 8px;
//                     border-radius: 12px;
//                     font-size: 11px;
//                     margin: 1px 2px;
//                     white-space: nowrap;
//                     position: relative;
//                     padding-right: 20px; /* Make space for X button */
//                 }
//                 .component-pill:hover {
//                     background-color: #0056b3;
//                 }
//                 .component-pills-container {
//                     line-height: 1.4;
//                 }
//                 .pill-remove-btn {
//                     position: absolute;
//                     right: 4px;
//                     top: 50%;
//                     transform: translateY(-50%);
//                     background: none;
//                     border: none;
//                     color: white;
//                     font-size: 10px;
//                     font-weight: bold;
//                     cursor: pointer;
//                     padding: 0;
//                     width: 12px;
//                     height: 12px;
//                     line-height: 10px;
//                     text-align: center;
//                 }
//                 .pill-remove-btn:hover {
//                     background-color: rgba(255,255,255,0.3);
//                     border-radius: 50%;
//                 }
//                 /* Ensure table header doesn't inherit pill colors */
//                 .frappe-grid .grid-heading-row [data-fieldname="component_used"] {
//                     background: none !important;
//                     color: inherit !important;
//                 }
//                 .frappe-grid .grid-heading-row th {
//                     background: none !important;
//                     color: inherit !important;
//                 }
//             </style>
//         `);
//     }
    
//     // Clear any existing formatted cells first
//     frm.fields_dict.repair_and_return.grid.wrapper.find('[data-fieldname="component_used"].pills-formatted').removeClass('pills-formatted');
    
//     // Find all component cells and format them
//     setTimeout(() => {
//         frm.fields_dict.repair_and_return.grid.wrapper.find('[data-fieldname="component_used"]').each(function() {
//             let $cell = $(this);
            
//             // Skip if this is a header cell
//             if ($cell.closest('.grid-heading-row').length > 0) {
//                 return;
//             }
            
//             // Get the actual field value from the doctype data
//             let $row = $cell.closest('.grid-row');
//             let rowIndex = $row.attr('data-idx');
            
//             if (rowIndex && !$cell.hasClass('pills-formatted')) {
//                 let actualRowIndex = parseInt(rowIndex) - 1;
//                 if (actualRowIndex >= 0 && actualRowIndex < frm.doc.repair_and_return.length) {
//                     let rowData = frm.doc.repair_and_return[actualRowIndex];
//                     let componentText = rowData.component_used || '';
                    
//                     if (componentText && componentText.trim() !== '') {
//                         let components = componentText.split(',').map(c => c.trim()).filter(c => c !== '');
                        
//                         if (components.length > 0) {
//                             let pillsHtml = '<div class="component-pills-container">';
//                             components.forEach((component) => {
//                                 pillsHtml += `<span class="component-pill" data-component="${component}" title="${component}">
//                                     ${component}
//                                     <button class="pill-remove-btn" data-row-idx="${rowIndex}" data-component="${component}" title="Remove ${component}">×</button>
//                                 </span>`;
//                             });
//                             pillsHtml += '</div>';
                            
//                             $cell.html(pillsHtml);
//                             $cell.addClass('pills-formatted');
//                         } else {
//                             // If no valid components, clear the cell
//                             $cell.html('');
//                             $cell.removeClass('pills-formatted');
//                         }
//                     } else {
//                         // If component text is empty, ensure cell is clear
//                         $cell.html('');
//                         $cell.removeClass('pills-formatted');
//                     }
//                 }
//             }
//         });
        
//         // Remove existing event handlers and add new ones (FIXED VERSION)
//         $(document).off('click', '.pill-remove-btn');
//         $(document).on('click', '.pill-remove-btn', function(e) {
//             e.preventDefault();
//             e.stopPropagation();
            
//             let componentToRemove = $(this).data('component');
//             let rowIdx = $(this).data('row-idx');
            
//             if (rowIdx) {
//                 let targetRowIndex = parseInt(rowIdx) - 1;
//                 if (targetRowIndex >= 0 && targetRowIndex < frm.doc.repair_and_return.length) {
//                     let targetRow = frm.doc.repair_and_return[targetRowIndex];
                    
//                     if (targetRow && targetRow.component_used) {
//                         // Remove the component from the comma-separated string
//                         // Filter out empty strings to handle edge cases
//                         let components = targetRow.component_used.split(',').map(c => c.trim()).filter(c => c !== '');
//                         let updatedComponents = components.filter(c => c !== componentToRemove);
                        
//                         // Handle empty string case explicitly
//                         let newValue = updatedComponents.length > 0 ? updatedComponents.join(', ') : '';
                        
//                         // Update using frappe.model.set_value
//                         frappe.model.set_value('Repair and Return Tech View Table', targetRow.name, 'component_used', newValue);
                        
//                         // If this was the last component, explicitly clear the cell
//                         if (updatedComponents.length === 0) {
//                             // Use a slight delay to ensure the model update has processed
//                             setTimeout(() => {
//                                 // Find the specific cell and clear it
//                                 let $row = frm.fields_dict.repair_and_return.grid.wrapper.find(`[data-idx="${rowIdx}"]`);
//                                 let $cell = $row.find('[data-fieldname="component_used"]');
                                
//                                 if ($cell.length) {
//                                     // Clear the cell content completely
//                                     $cell.html('');
//                                     $cell.removeClass('pills-formatted');
                                    
//                                     // Also ensure the text content is empty
//                                     $cell.text('');
                                    
//                                     // Trigger change event to ensure grid updates
//                                     $cell.trigger('change');
//                                 }
//                             }, 50);
//                         }
                        
//                         // Force refresh and reformat
//                         frm.refresh_field('repair_and_return');
                        
//                         // Only reformat if there are components left
//                         if (updatedComponents.length > 0) {
//                             setTimeout(() => {
//                                 format_components_as_pills(frm);
//                             }, 100);
//                         }
                        
//                         frappe.show_alert({
//                             message: __(`Component "${componentToRemove}" removed`),
//                             indicator: 'orange'
//                         });
//                     }
//                 }
//             }
//         });
//     }, 500);
// }

// function set_current_technician(frm) {
//     let current_user = frappe.session.user;
//     console.log("current session user", current_user)

//     frappe.call({
//         method: "frappe.client.get",
//         args: {
//             doctype: "Employee",
//             filters: {
//                 'prefered_email': current_user
//             },
//         },
//         callback: function (r) {
//             frm.set_value("technician", "");
            
//             console.log("msg", r.message)
//             if (r.message && r.message.user_id) {
//                 let employee_id = r.message.name;
            
//                 if (employee_id.includes(' - ')) {
//                     employee_id = employee_id.split(' - ')[0];
//                 }

//                 if (!frm.doc.technician.includes(' - ')) {
//                     frappe.db.get_value('Employee', employee_id, ['employee', 'employee_name'])
//                         .then(r => {
//                             if (r.message) {
//                                 const { employee, employee_name } = r.message;
//                                 frm.set_value('technician', `${employee} - ${employee_name}`);
//                             }
//                         })
//                         .catch(err => {
//                             console.error('Error fetching employee:', err);
//                             frappe.msgprint(`Employee ${employee_id} not found`);
//                         });
//                 }
//             } 
//         }
//     });
// }

// function setup_field_filters(frm) {
//     frm.set_query("lot_no", function () {
//         if (frm.doc.customer) {
//             return {
//                 "filters": {
//                     "customer": frm.doc.customer,
//                     "docstatus": ["!=", 2]
//                 }
//             };
//         }
//     });
// }

// function load_technician_rma_data(frm) {
//     if (!frm.doc.technician) {
//         frappe.show_alert({
//             message: 'Technician field is required',
//             indicator: 'red'
//         });
//         return;
//     }

//     frappe.show_alert({
//         message: 'Loading RMA data for technician...',
//         indicator: 'blue'
//     });

//     frappe.call({
//         method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.get_technician_rma_data",
//         args: {
//             technician: frm.doc.technician,
//             customer: frm.doc.customer || '',
//             lot_no: frm.doc.lot_no || '',
//             warranty_status: frm.doc.warranty_status || '',
//             circle: frm.doc.circle || '',
//             rma_id: frm.doc.rma_id || '',           // Added RMA ID filter
//             repair_status: frm.doc.repair_status || ''  // Added Repair Status filter
//         },
//         callback: function (r) {
//             frm.clear_table("repair_and_return");
//             frm.refresh_field("repair_and_return");

//             console.log("RMA data loaded", r.message)

//             if (r.message && r.message.length > 0) {
//                 localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(r.message));
                
//                 r.message.forEach(function (row) {
//                     let child = frm.add_child("repair_and_return");
                    
//                     child.lot_no = row.lot_no;
//                     child.rma_id = row.rma_id || row.name;  // Check both fields

//                     // Ensure only Employee ID is stored
//                     if (row.repaired_by) {
//                         child.assigned_to = row.repaired_by.includes(" - ")
//                             ? row.repaired_by.split(" - ")[0]
//                             : row.repaired_by;

//                         child.assigned_to_name = row.repaired_by;
//                         child.employee_name = row.repaired_by.split(' - ')[1];
//                     }

//                     child.assigned_date = row.rma_assigned_date;
//                     child.repaired_date = row.repaired_date;
//                     child.customer = row.customer;
//                     child.receiving_r = row.receiving_r || '';
//                     child.make = row.make;
//                     child.model_no = row.model_no;
//                     child.part_no = row.part_no;
//                     child.serial_no = row.serial_no;
//                     child.warranty_st = row.warranty_status;
//                     child.component_used = row.component_used;
//                     child.fault_found = row.fault_found;
//                     child.repair_remarks = row.remarks && row.remarks.length > 0 ? row.remarks[row.remarks.length - 1]?.repair_remarks : '';
//                     child.repair_status = row.rma_id_status;  // Use the pre-populated status

//                     if (row.submitted_material_receipt) {
//                         child.material_receipt = row.submitted_material_receipt;
//                     }

//                     if(row.rma_assigned_date){
//                         child.assigned_date = row.rma_assigned_date;
//                     }

//                     if(row.receiving_date) {
//                         child.receiving_date = row.receiving_date;
//                         let today_date = frappe.datetime.get_today();
//                         let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
//                         child.tat = diff;
//                     }
//                 });

//                 frm.refresh_field("repair_and_return");

//                 // Format components as pills after data is loaded
//                 setTimeout(() => {
//                     format_components_as_pills(frm);
//                 }, 1000);

//                 let filter_info = get_filter_info(frm);
//                 frappe.show_alert({
//                     message: `Loaded ${r.message.length} RMA records for ${frm.doc.technician}${filter_info}`,
//                     indicator: 'green'
//                 });

//             } else {
//                 frappe.show_alert({
//                     message: `No RMA data found for technician: ${frm.doc.technician}${get_active_filters(frm)}`,
//                     indicator: 'orange'
//                 });
//             }
//         },
//         error: function (err) {
//             console.error("Error loading RMA data:", err);
//             frappe.show_alert({
//                 message: 'Error loading RMA data',
//                 indicator: 'red'
//             });
//         }
//     });
// }

// // Also update the get_active_filters_array function to include the new filters
// function get_active_filters_array(frm) {
//     let filters = [];
//     if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
//     if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
//     if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
//     if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
//     if (frm.doc.rma_id) filters.push(`RMA ID: ${frm.doc.rma_id}`);  // Added
//     if (frm.doc.repair_status) filters.push(`Status: ${frm.doc.repair_status}`);  // Added
//     return filters;
// }

// function get_filter_info(frm) {
//     let filters = get_active_filters_array(frm);
//     if (filters.length > 0) {
//         return ` (Filtered: ${filters.join(', ')})`;
//     }
//     return '';
// }

// function get_active_filters(frm) {
//     let filters = get_active_filters_array(frm);
//     if (filters.length > 0) {
//         return ` with filters: ${filters.join(', ')}`;
//     }
//     return '';
// }

// frappe.ui.form.on("Repair and Return Tech View Table", {
//     select_components: function(frm, cdt, cdn) {
//         console.log("Clicked");
//         let row = locals[cdt][cdn];
        
//         // Fetch ONLY items with item_group = 'Components'
//         frappe.call({
//             method: 'frappe.client.get_list',
//             args: {
//                 doctype: 'Item',
//                 filters: {
//                     'disabled': 0,
//                     'item_group': 'Components' // Only Components
//                 },
//                 fields: ['name', 'item_name', 'item_code', 'item_group'],
//                 limit_page_length: 0,
//                 order_by: 'item_name asc'
//             },
//             callback: function(response) {
//                 // If no Components found, show message
//                 if (!response.message || response.message.length === 0) {
//                     frappe.msgprint(__('No items found with Item Group = "Components"'));
//                     return;
//                 }
                
//                 // Create dialog with Components only
//                 create_components_dialog(response.message);
//             }
//         });
        
//         // Function to create the dialog
//         function create_components_dialog(components_data) {
//             let default_options = components_data.map(item => item.name);
                    
//             // Create dialog with MultiSelectPills field linked to Item
//             let dialog = new frappe.ui.Dialog({
//                 title: __('Select Components'),
//                 size: 'large',
//                 fields: [
//                     {
//                         fieldname: 'item_group_filter',
//                         fieldtype: 'Link',
//                         label: __('Item Group'),
//                         options: 'Item Group',
//                         default: 'Components',
//                         read_only: 1
//                     },
//                     {
//                         fieldname: 'selected_components',
//                         fieldtype: 'MultiSelectPills',
//                         label: __('Select Components'),
//                         options: default_options,
//                         reqd: 1
//                     }
//                 ],
//                 primary_action_label: __('Select'),
//                 primary_action: function(values) {
//                     // Get selected items and their names
//                     let selected_items = values.selected_components || [];
                    
//                     if (selected_items.length === 0) {
//                         frappe.msgprint(__('Please select at least one component'));
//                         return;
//                     }
                    
//                     // Get item names for selected items
//                     frappe.call({
//                         method: 'frappe.client.get_list',
//                         args: {
//                             doctype: 'Item',
//                             filters: {
//                                 'name': ['in', selected_items]
//                             },
//                             fields: ['name', 'item_name']
//                         },
//                         callback: function(item_response) {
//                             if (item_response.message) {
//                                 let component_names = item_response.message.map(item => item.item_name).join(', ');
                                
//                                 // Update the components field with selected values
//                                 frappe.model.set_value(cdt, cdn, 'component_used', component_names);
                                
//                                 // Refresh the field to show updated value
//                                 frm.refresh_field('repair_and_return');
                                
//                                 // Format the newly added components as pills
//                                 setTimeout(() => {
//                                     format_components_as_pills(frm);
//                                 }, 500);
                                
//                                 // Show success message
//                                 frappe.show_alert({
//                                     message: __('Components updated successfully'),
//                                     indicator: 'green'
//                                 });
//                             }
//                         }
//                     });
                    
//                     dialog.hide();
//                 },
//                 secondary_action_label: __('Cancel')
//             });
            
//             // If components field already has values, pre-select them
//             if (row.component_used) {
//                 // Get existing item names and find their codes
//                 let existing_names = row.component_used.split(', ').map(name => name.trim());
                
//                 frappe.call({
//                     method: 'frappe.client.get_list',
//                     args: {
//                         doctype: 'Item',
//                         filters: {
//                             'item_name': ['in', existing_names]
//                         },
//                         fields: ['name', 'item_name']
//                     },
//                     callback: function(existing_response) {
//                         if (existing_response.message) {
//                             let existing_codes = existing_response.message.map(item => item.name);
//                             dialog.set_value('selected_components', existing_codes);
//                         }
//                     }
//                 });
//             }
            
//             dialog.show();
//         } // End of create_components_dialog function
//     },
    
//     // Individual row material transfer creation - only for that specific row's components
//     create_material_receipt: function(frm, cdt, cdn) {
//         console.log("Create Material Transfer clicked for individual row");
//         let row = locals[cdt][cdn];
        
//         // Check if components are selected
//         if (!row.component_used) {
//             frappe.msgprint(__('Please select components first'));
//             return;
//         }
        
//         // Check if RMA ID exists
//         if (!row.rma_id) {
//             frappe.msgprint(__('RMA ID is required'));
//             return;
//         }
        
//         // First, save the component_used to RMA BIN
//         frappe.call({
//             method: 'frappe.client.set_value',
//             args: {
//                 doctype: 'RMA BIN',
//                 name: row.rma_id,
//                 fieldname: {
//                     'component_used': row.component_used,
//                     'fault_found': row.fault_found,
//                     'repaired_date': row.assigned_date,
//                     'rma_id_status': row.repair_status  
//                 }
//             },
//             callback: function(update_response) {
//                 console.log("RMA BIN updated with components");
                
//                 frappe.db.get_doc('RMA BIN', row.rma_id).then(doc => {
//                     console.log("Fetched RMA BIN:", doc);

//                     // Ensure remarks child table exists
//                     if (!doc.remarks) {
//                         doc.remarks = [];
//                     }

//                     // Add a new child row manually
//                     doc.remarks.push({
//                         repair_remarks: row.repair_remarks,
//                         timestamp: frappe.datetime.now_datetime()
//                     });

//                     if (!doc.rma_status) {
//                         doc.rma_status = [];
//                     }

//                     doc.rma_status.push({
//                         repair_status: row.repair_status,
//                         timestamp: frappe.datetime.now_datetime()
//                     });

//                     // Save the updated document back
//                     frappe.call({
//                         method: 'frappe.client.save',
//                         args: {
//                             doc: doc
//                         },
//                         callback: function (save_response) {
//                             frappe.show_alert({
//                                 message: __('Remarks added to RMA BIN: ' + row.rma_id),
//                                 indicator: 'green'
//                             });
//                         }
//                     });
//                 });
                
//                 // After saving to RMA BIN, proceed with creating Stock Entry
//                 // Parse the component names
//                 let component_names = row.component_used.split(', ').map(name => name.trim());
                
//                 // Fetch item details for the components
//                 frappe.call({
//                     method: 'frappe.client.get_list',
//                     args: {
//                         doctype: 'Item',
//                         filters: {
//                             'item_name': ['in', component_names]
//                         },
//                         fields: ['name', 'item_name', 'item_code', 'stock_uom', 'description', 'valuation_rate']
//                     },
//                     callback: function(response) {
//                         if (!response.message || response.message.length === 0) {
//                             frappe.msgprint(__('Could not fetch component details'));
//                             return;
//                         }
                        
//                         console.log("Components fetched:", response.message);
                        
//                         // Store items to add after form loads
//                         let items_to_add = response.message;
                        
//                         // Create new Stock Entry WITHOUT items initially
//                         frappe.new_doc('Stock Entry', {
//                             stock_entry_type: 'Material Transfer',
//                             custom_technician: frm.doc.technician,
//                             purpose: 'Material Transfer',
//                             custom_customer: row.customer,
//                             custom_rma_id: row.rma_id  // Add RMA ID reference for this specific row
//                         }, doc => {
//                             // Add items after the form is loaded
//                             setTimeout(() => {
//                                 // Get the current form
//                                 let se_frm = cur_frm;
                                
//                                 // Clear any existing items
//                                 se_frm.clear_table('items');
                                
//                                 // Add each component as a row
//                                 items_to_add.forEach(function(item) {
//                                     let row = se_frm.add_child('items');
//                                     row.item_code = item.name;
//                                     row.item_name = item.item_name;
//                                     row.description = item.description || item.item_name;
//                                     row.uom = item.stock_uom || 'Nos';
//                                     row.stock_uom = item.stock_uom || 'Nos';
//                                     row.s_warehouse = 'Finished Goods - DTPL';  // Source warehouse
//                                     row.t_warehouse = 'Repair Floor - DTPL';    // Target warehouse
//                                     row.conversion_factor = 1;
//                                     row.qty = 1; // Default quantity - user can change this
//                                     row.transfer_qty = 1;
//                                     row.basic_rate = item.valuation_rate || 0;
//                                 });
                                
//                                 // Refresh the items field to show the new rows
//                                 se_frm.refresh_field('items');
//                                 frm.save()
//                                 frappe.show_alert({
//                                     message: __('Material Transfer created with ' + items_to_add.length + ' components for RMA: ' + row.rma_id),
//                                     indicator: 'blue'
//                                 });
//                             }, 500); // Small delay to ensure form is fully loaded
//                         });
//                     },
//                     error: function(err) {
//                         console.error("Error details:", err);
//                         frappe.msgprint(__('Error fetching component details'));
//                     }
//                 });
//             },
//             error: function(err) {
//                 console.error("Error updating RMA BIN:", err);
//                 frappe.msgprint(__('Error updating RMA BIN with components: ' + (err.message || err)));
//             }
//         });
//     },
    
//     refresh: function(frm) {
//         setup_field_filters(frm);
        
//         // Fix column header display
//         setTimeout(() => {
//             let $header = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="component_used"]');
//             if ($header.length) {
//                 $header.html('Component Used'); // Set proper header text without styling
//             }
//         }, 500);
        
//         // Apply pills formatting when child table refreshes
//         setTimeout(() => {
//             format_components_as_pills(frm);
//         }, 500);
//     },

//     assigned_to: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
        
//         if (row.assigned_to) {
//             frappe.db.get_doc('Employee', row.assigned_to).then(item => {
//                 frappe.model.set_value(cdt, cdn, 'employee_name', item.employee_name);
//             }).catch(err => {
//                 console.log('Error fetching employee:', err);
//                 frappe.model.set_value(cdt, cdn, 'employee_name', '');
//             });
//         }
//     },
    
//     // Add this event to reformat components when the field value changes
//     component_used: function(frm, cdt, cdn) {
//         setTimeout(() => {
//             format_components_as_pills(frm);
//         }, 500);
//     }
// });

// frappe.form.link_formatters['Employee'] = function(value, doc) {
//     if(doc && doc.employee_name && doc.employee_name !== value) {
//         return value + " - " + doc.employee_name;
//     } else {
//         return value;
//     }
// };

















// Copyright (c) 2025, Anantdv and contributors
// For license information, please see license.txt

frappe.ui.form.on('Repair and Return Technician View', {
    refresh: function (frm) {
        console.log("refresh called")
        
        // Fix the field label display
        if (frm.fields_dict.repair_and_return && frm.fields_dict.repair_and_return.grid) {
            // Update the column header label
            setTimeout(() => {
                let $header = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="component_used"]');
                if ($header.length) {
                    $header.html('Component Used'); // Set proper header text without styling
                }
            }, 1000);
        }

        // set_current_technician(frm);

        if (frm.custom_buttons["Get Data"]) {
            frm.remove_custom_button("Get Data");
        }

        frm.add_custom_button(__('Get Data'), function () {
            load_technician_rma_data(frm);
        }).addClass('btn-primary');

        frm.add_custom_button(__('Create Material Request'), function () {
            // Get ALL repair_and_return items that have components (no filter for existing material receipts)
            let items_with_components = frm.doc.repair_and_return.filter(item => 
                item.component_used && 
                item.component_used.trim() !== ''
            );
            
            // Check if there are any items to process
            if (items_with_components.length === 0) {
                frappe.msgprint(__('No items found with components'));
                return;
            }
            
            let rma_ids = items_with_components.map(item => item.rma_id).join(', ');
            console.log("All rma ids with components..", rma_ids);
            let components = []
            
            items_with_components.forEach((row) => {
                if(row.component_used) {
                    row.component_used.split(", ").forEach(r => {
                        components.push(r)
                    })

                    frappe.call({
                        method: 'frappe.client.set_value',
                        args: {
                            doctype: 'RMA BIN',
                            name: row.rma_id,
                            fieldname: {
                                'component_used': row.component_used,
                                'fault_found': row.fault_found,
                                'repaired_date': row.assigned_date,
                                'repair_remarks': row.repair_remarks,
                                'rma_id_status': row.repair_status 
                            }
                        },
                        callback: function (update_response) {
                            frappe.db.get_doc('RMA BIN', row.rma_id).then(doc => {
                                console.log("Fetched RMA BIN:", doc);

                                // Ensure remarks child table exists
                                if (!doc.remarks) {
                                    doc.remarks = [];
                                }

                                // Add a new child row manually
                                doc.remarks.push({
                                    repair_remarks: row.repair_remarks,
                                    timestamp: frappe.datetime.now_datetime()
                                });

                                if (!doc.rma_status) {
                                    doc.rma_status = [];
                                }

                                doc.rma_status.push({
                                    repair_status: row.repair_status,
                                    timestamp: frappe.datetime.now_datetime()
                                });

                                // Save the updated document back
                                frappe.call({
                                    method: 'frappe.client.save',
                                    args: {
                                        doc: doc
                                    },
                                    callback: function (save_response) {
                                        // Success callback
                                    }
                                });
                            });

                            // Show success message for RMA BIN update
                            frappe.show_alert({
                                message: __('Components saved to RMA BIN: ' + row.rma_id),
                                indicator: 'green'
                            });
                        },
                        error: function (err) {
                            console.error("Error updating RMA BIN:", err);
                            frappe.msgprint(__('Error updating RMA BIN with components: ' + (err.message || err)));
                        }
                    });
                }
            })

            console.log("components", components)

            // Fetch item details for the components
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Item',
                    filters: {
                        'item_name': ['in', components]
                    },
                    fields: ['name', 'item_name', 'item_code', 'stock_uom', 'description', 'valuation_rate']
                },
                callback: function(response) {
                    if (!response.message || response.message.length === 0) {
                        frappe.msgprint(__('Could not fetch component details'));
                        return;
                    }
                    
                    console.log("Components fetched:", response.message);
                    
                    let items_to_add = response.message;
                    
                    frappe.new_doc('Stock Entry', {
                        stock_entry_type: 'Material Transfer',
                        custom_technician: frm.doc.technician,
                        purpose: 'Material Transfer',
                        custom_customer: items_with_components[0].customer, // Use first item's customer
                        custom_rma_id: rma_ids  
                    }, doc => {
                        
                        setTimeout(() => {
                            // Get the current form
                            let se_frm = cur_frm;
                            
                            // Clear any existing items
                            se_frm.clear_table('items');
                            
                            // Add each component as a row
                            items_to_add.forEach(function(item) {
                                let row = se_frm.add_child('items');
                                row.item_code = item.name;
                                row.item_name = item.item_name;
                                row.description = item.description || item.item_name;
                                row.uom = item.stock_uom || 'Nos';
                                row.stock_uom = item.stock_uom || 'Nos';
                                row.s_warehouse = 'Finished Goods - DTPL';  // Source warehouse
                                row.t_warehouse = 'Repair Floor - DTPL';    // Target warehouse
                                row.conversion_factor = 1;
                                row.qty = 1; // Default quantity - user can change this
                                row.transfer_qty = 1;
                                row.basic_rate = item.valuation_rate || 0;
                            });
                            
                            // Refresh the items field to show the new rows
                            se_frm.refresh_field('items');
                            
                            frappe.show_alert({
                                message: __('Material Transfer created with ' + items_to_add.length + ' components for ' + items_with_components.length + ' RMA IDs'),
                                indicator: 'blue'
                            });
                        }, 500); // Small delay to ensure form is fully loaded
                    });
                },
                error: function(err) {
                    console.error("Error details:", err);
                    frappe.msgprint(__('Error fetching component details'));
                }
            });
        }).addClass('btn-primary');

        setup_field_filters(frm);
        
        // Apply component pills formatting after data load
        setTimeout(() => {
            format_components_as_pills(frm);
        }, 1000);
    },

    customer: function (frm) {
        if (frm.doc.lot_no) {
            frm.set_value('lot_no', '');
        }
    },

    onload_post_render: function (frm) {
        console.log("onload post render")
        set_current_technician(frm);
        frm.set_value("lot_no", "")
        frm.set_value("customer", "")
        frm.set_value("circle", "")
        frm.set_value("warranty_status", "")
        frm.clear_table("repair_and_return");
        frm.refresh_field("repair_and_return")
        // frm.save()
    },

     before_save: async function (frm) {
        let oldData = JSON.parse(localStorage.getItem("repair_and_return_technician_view_snapshot") || "[]");
        let local_storage_val = []

        for (let row of frm.doc.repair_and_return) {
            let original = oldData.find(o => o.rma_id === row.rma_id);
            if (!original) continue;

            let hasSimpleChange = false;
            let updates = {};

            function normalize(val) {
                if (val === undefined || val === null) return "";
                return val;
            }

            if (normalize(row.repair_status) !== normalize(original.rma_id_status)) {
                updates.rma_id_status = row.repair_status;
                hasSimpleChange = true
            }

            if (normalize(row.fault_found) !== normalize(original.fault_found)) {
                console.log("fault_found changes", row.fault_found, original.fault_found);
                updates.fault_found = row.fault_found;
                hasSimpleChange = true;
            }

            if(normalize(row.assigned_date) !== normalize(original.repaired_date)){
                updates.repaired_date = row.assigned_date
                hasSimpleChange = true
            }

            let hasRepairStatusChanged = normalize(row.repair_status) !== normalize(original?.rma_id_status);

            // Check remarks (child table in RMA BIN)
            let remarksChanged = row.repair_remarks !== original.remarks[original.remarks.length - 1]?.repair_remarks;

            console.log("Updates for RMA", row.rma_id, ":", updates);

            // Push updates for simple fields
            if (hasSimpleChange) {
                await frappe.db.set_value("RMA BIN", row.rma_id, updates);
            }

            // Handle remarks separately (child table)
            if (remarksChanged) {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                // Replace the last remark or append new
                rmaDoc.remarks.push({
                    repair_remarks: row.repair_remarks,
                    timestamp: frappe.datetime.now_datetime()
                });
                rmaDoc.last_updated_on = frappe.datetime.now_datetime();
                await frappe.call({
                    method: "frappe.client.save",
                    args: { doc: rmaDoc }
                });
            }

            // console.log("Repair status changed for RMA", row.rma_id, "from", original?.rma_id_status, "to", row.repair_status);
            if (hasRepairStatusChanged) {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                // Replace the last remark or append new
                rmaDoc.rma_status.push({
                    repair_status: row.repair_status,
                    timestamp: frappe.datetime.now_datetime()
                });
                rmaDoc.last_updated_on = frappe.datetime.now_datetime();
                await frappe.call({
                    method: "frappe.client.save",
                    args: { doc: rmaDoc }
                });
            }

            const rma_bin_data = await frappe.db.get_doc("RMA BIN", row.rma_id);
            local_storage_val.push(rma_bin_data)
        }

        localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(local_storage_val));

        // Update snapshot after save
        // localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(frm.doc.repair_and_return));
        // load_technician_rma_data(frm)
    }
});

// Updated Function to format components as pills with remove functionality - FIXED
function format_components_as_pills(frm) {
    // Add custom CSS for pills with improved styling
    if (!$('#component-pills-css').length) {
        $('head').append(`
            <style id="component-pills-css">
                .component-pill {
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 2px 8px 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    margin: 1px 2px;
                    white-space: nowrap;
                    position: relative;
                    padding-right: 20px; /* Make space for X button */
                }
                .component-pill:hover {
                    background-color: #0056b3;
                }
                .component-pills-container {
                    line-height: 1.4;
                }
                .pill-remove-btn {
                    position: absolute;
                    right: 4px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    cursor: pointer;
                    padding: 0;
                    width: 12px;
                    height: 12px;
                    line-height: 10px;
                    text-align: center;
                }
                .pill-remove-btn:hover {
                    background-color: rgba(255,255,255,0.3);
                    border-radius: 50%;
                }
                /* Ensure table header doesn't inherit pill colors */
                .frappe-grid .grid-heading-row [data-fieldname="component_used"] {
                    background: none !important;
                    color: inherit !important;
                }
                .frappe-grid .grid-heading-row th {
                    background: none !important;
                    color: inherit !important;
                }
            </style>
        `);
    }
    
    // Clear any existing formatted cells first
    frm.fields_dict.repair_and_return.grid.wrapper.find('[data-fieldname="component_used"].pills-formatted').removeClass('pills-formatted');
    
    // Find all component cells and format them
    setTimeout(() => {
        frm.fields_dict.repair_and_return.grid.wrapper.find('[data-fieldname="component_used"]').each(function() {
            let $cell = $(this);
            
            // Skip if this is a header cell
            if ($cell.closest('.grid-heading-row').length > 0) {
                return;
            }
            
            // Get the actual field value from the doctype data
            let $row = $cell.closest('.grid-row');
            let rowIndex = $row.attr('data-idx');
            
            if (rowIndex && !$cell.hasClass('pills-formatted')) {
                let actualRowIndex = parseInt(rowIndex) - 1;
                if (actualRowIndex >= 0 && actualRowIndex < frm.doc.repair_and_return.length) {
                    let rowData = frm.doc.repair_and_return[actualRowIndex];
                    let componentText = rowData.component_used || '';
                    
                    if (componentText && componentText.trim() !== '') {
                        let components = componentText.split(',').map(c => c.trim()).filter(c => c !== '');
                        
                        if (components.length > 0) {
                            let pillsHtml = '<div class="component-pills-container">';
                            components.forEach((component) => {
                                pillsHtml += `<span class="component-pill" data-component="${component}" title="${component}">
                                    ${component}
                                    <button class="pill-remove-btn" data-row-idx="${rowIndex}" data-component="${component}" title="Remove ${component}">×</button>
                                </span>`;
                            });
                            pillsHtml += '</div>';
                            
                            $cell.html(pillsHtml);
                            $cell.addClass('pills-formatted');
                        } else {
                            // If no valid components, clear the cell
                            $cell.html('');
                            $cell.removeClass('pills-formatted');
                        }
                    } else {
                        // If component text is empty, ensure cell is clear
                        $cell.html('');
                        $cell.removeClass('pills-formatted');
                    }
                }
            }
        });
        
        // Remove existing event handlers and add new ones (FIXED VERSION)
        $(document).off('click', '.pill-remove-btn');
        $(document).on('click', '.pill-remove-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let componentToRemove = $(this).data('component');
            let rowIdx = $(this).data('row-idx');
            
            if (rowIdx) {
                let targetRowIndex = parseInt(rowIdx) - 1;
                if (targetRowIndex >= 0 && targetRowIndex < frm.doc.repair_and_return.length) {
                    let targetRow = frm.doc.repair_and_return[targetRowIndex];
                    
                    if (targetRow && targetRow.component_used) {
                        // Remove the component from the comma-separated string
                        // Filter out empty strings to handle edge cases
                        let components = targetRow.component_used.split(',').map(c => c.trim()).filter(c => c !== '');
                        let updatedComponents = components.filter(c => c !== componentToRemove);
                        
                        // Handle empty string case explicitly
                        let newValue = updatedComponents.length > 0 ? updatedComponents.join(', ') : '';
                        
                        // Update using frappe.model.set_value
                        frappe.model.set_value('Repair and Return Tech View Table', targetRow.name, 'component_used', newValue);
                        
                        // If this was the last component, explicitly clear the cell
                        if (updatedComponents.length === 0) {
                            // Use a slight delay to ensure the model update has processed
                            setTimeout(() => {
                                // Find the specific cell and clear it
                                let $row = frm.fields_dict.repair_and_return.grid.wrapper.find(`[data-idx="${rowIdx}"]`);
                                let $cell = $row.find('[data-fieldname="component_used"]');
                                
                                if ($cell.length) {
                                    // Clear the cell content completely
                                    $cell.html('');
                                    $cell.removeClass('pills-formatted');
                                    
                                    // Also ensure the text content is empty
                                    $cell.text('');
                                    
                                    // Trigger change event to ensure grid updates
                                    $cell.trigger('change');
                                }
                            }, 50);
                        }
                        
                        // Force refresh and reformat
                        frm.refresh_field('repair_and_return');
                        
                        // Only reformat if there are components left
                        if (updatedComponents.length > 0) {
                            setTimeout(() => {
                                format_components_as_pills(frm);
                            }, 100);
                        }
                        
                        frappe.show_alert({
                            message: __(`Component "${componentToRemove}" removed`),
                            indicator: 'orange'
                        });
                    }
                }
            }
        });
    }, 500);
}

function set_current_technician(frm) {
    let current_user = frappe.session.user;
    console.log("current session user", current_user)

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Employee",
            filters: {
                'prefered_email': current_user
            },
        },
        callback: function (r) {
            frm.set_value("technician", "");
            
            console.log("msg", r.message)
            if (r.message && r.message.user_id) {
                let employee_id = r.message.name;
            
                if (employee_id.includes(' - ')) {
                    employee_id = employee_id.split(' - ')[0];
                }

                if (!frm.doc.technician.includes(' - ')) {
                    frappe.db.get_value('Employee', employee_id, ['employee', 'employee_name'])
                        .then(r => {
                            if (r.message) {
                                const { employee, employee_name } = r.message;
                                frm.set_value('technician', `${employee} - ${employee_name}`);
                            }
                        })
                        .catch(err => {
                            console.error('Error fetching employee:', err);
                            frappe.msgprint(`Employee ${employee_id} not found`);
                        });
                }
            } 
        }
    });
}

function setup_field_filters(frm) {
    frm.set_query("lot_no", function () {
        if (frm.doc.customer) {
            return {
                "filters": {
                    "customer": frm.doc.customer,
                    "docstatus": ["!=", 2]
                }
            };
        }
    });
}

function load_technician_rma_data(frm) {
    if (!frm.doc.technician) {
        frappe.show_alert({
            message: 'Technician field is required',
            indicator: 'red'
        });
        return;
    }

    frappe.show_alert({
        message: 'Loading RMA data for technician...',
        indicator: 'blue'
    });

    frappe.call({
        method: "rms.rms.doctype.repair_and_return_technician_view.repair_and_return_technician_view.get_technician_rma_data",
        args: {
            technician: frm.doc.technician,
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',           // Added RMA ID filter
            repair_status: frm.doc.repair_status || ''  // Added Repair Status filter
        },
        callback: function (r) {
            frm.clear_table("repair_and_return");
            frm.refresh_field("repair_and_return");

            console.log("RMA data loaded", r.message)

            if (r.message && r.message.length > 0) {
                localStorage.setItem("repair_and_return_technician_view_snapshot", JSON.stringify(r.message));
                
                r.message.forEach(function (row) {
                    let child = frm.add_child("repair_and_return");
                    
                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_id || row.name;  // Check both fields

                    // Ensure only Employee ID is stored
                    if (row.repaired_by) {
                        child.assigned_to = row.repaired_by.includes(" - ")
                            ? row.repaired_by.split(" - ")[0]
                            : row.repaired_by;

                        child.assigned_to_name = row.repaired_by;
                        child.employee_name = row.repaired_by.split(' - ')[1];
                    }

                    child.assigned_date = row.rma_assigned_date;
                    child.repaired_date = row.repaired_date;
                    child.customer = row.customer;
                    child.receiving_r = row.receiving_r || '';
                    child.make = row.make;
                    child.model_no = row.model_no;
                    child.part_no = row.part_no;
                    child.serial_no = row.serial_no;
                    child.warranty_st = row.warranty_status;
                    child.component_used = row.component_used;
                    child.fault_found = row.fault_found;
                    child.repair_remarks = row.remarks && row.remarks.length > 0 ? row.remarks[row.remarks.length - 1]?.repair_remarks : '';
                    child.repair_status = row.rma_id_status;  // Use the pre-populated status

                    if (row.submitted_material_receipt) {
                        child.material_receipt = row.submitted_material_receipt;
                    }

                    if(row.rma_assigned_date){
                        child.assigned_date = row.rma_assigned_date;
                    }

                    if(row.receiving_date) {
                        child.receiving_date = row.receiving_date;
                        let today_date = frappe.datetime.get_today();
                        let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
                        child.tat = diff;
                    }
                });

                frm.refresh_field("repair_and_return");

                // Format components as pills after data is loaded
                setTimeout(() => {
                    format_components_as_pills(frm);
                }, 1000);

                let filter_info = get_filter_info(frm);
                frappe.show_alert({
                    message: `Loaded ${r.message.length} RMA records for ${frm.doc.technician}${filter_info}`,
                    indicator: 'green'
                });

            } else {
                frappe.show_alert({
                    message: `No RMA data found for technician: ${frm.doc.technician}${get_active_filters(frm)}`,
                    indicator: 'orange'
                });
            }
        },
        error: function (err) {
            console.error("Error loading RMA data:", err);
            frappe.show_alert({
                message: 'Error loading RMA data',
                indicator: 'red'
            });
        }
    });
}

// Also update the get_active_filters_array function to include the new filters
function get_active_filters_array(frm) {
    let filters = [];
    if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
    if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
    if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
    if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
    if (frm.doc.rma_id) filters.push(`RMA ID: ${frm.doc.rma_id}`);  // Added
    if (frm.doc.repair_status) filters.push(`Status: ${frm.doc.repair_status}`);  // Added
    return filters;
}

function get_filter_info(frm) {
    let filters = get_active_filters_array(frm);
    if (filters.length > 0) {
        return ` (Filtered: ${filters.join(', ')})`;
    }
    return '';
}

function get_active_filters(frm) {
    let filters = get_active_filters_array(frm);
    if (filters.length > 0) {
        return ` with filters: ${filters.join(', ')}`;
    }
    return '';
}

frappe.ui.form.on("Repair and Return Tech View Table", {
    // select_components: function(frm, cdt, cdn) {
    //     console.log("Select Components clicked");
    //     let row = locals[cdt][cdn];
        
    //     // Prevent multiple dialogs by checking if one is already open
    //     if (window.activeComponentDialog) {
    //         console.log("Dialog already open");
    //         return;
    //     }
        
    //     // Fetch ONLY items with item_group = 'Components'
    //     frappe.call({
    //         method: 'frappe.client.get_list',
    //         args: {
    //             doctype: 'Item',
    //             filters: {
    //                 'disabled': 0,
    //                 'item_group': 'Components' // Only Components
    //             },
    //             fields: ['name', 'item_name', 'item_code', 'item_group'],
    //             limit_page_length: 0,
    //             order_by: 'item_name asc'
    //         },
    //         callback: function(response) {
    //             // If no Components found, show message
    //             if (!response.message || response.message.length === 0) {
    //                 frappe.msgprint(__('No items found with Item Group = "Components"'));
    //                 return;
    //             }
                
    //             // Create dialog with Components only
    //             create_components_dialog(response.message);
    //         }
    //     });
        
    //     // Function to create the dialog
    //     function create_components_dialog(components_data) {
    //         let default_options = components_data.map(item => item.name);
            
    //         // Get existing component names if any
    //         let existing_component_names = [];
    //         if (row.component_used) {
    //             existing_component_names = row.component_used.split(',').map(name => name.trim()).filter(name => name !== '');
    //         }
                    
    //         // Create dialog with MultiSelectPills field linked to Item
    //         let dialog = new frappe.ui.Dialog({
    //             title: __('Select Components'),
    //             size: 'large',
    //             fields: [
    //                 {
    //                     fieldname: 'item_group_filter',
    //                     fieldtype: 'Link',
    //                     label: __('Item Group'),
    //                     options: 'Item Group',
    //                     default: 'Components',
    //                     read_only: 1
    //                 },
    //                 {
    //                     fieldname: 'selected_components',
    //                     fieldtype: 'MultiSelectPills',
    //                     label: __('Select Components'),
    //                     options: default_options,
    //                     reqd: 1
    //                 }
    //             ],
    //             primary_action_label: __('Select'),
    //             primary_action: function(values) {
    //                 // Prevent double-processing
    //                 if (dialog.processing) {
    //                     return;
    //                 }
    //                 dialog.processing = true;
                    
    //                 // Get selected items and their names
    //                 let selected_items = values.selected_components || [];
                    
    //                 if (selected_items.length === 0) {
    //                     frappe.msgprint(__('Please select at least one component'));
    //                     dialog.processing = false;
    //                     return;
    //                 }
                    
    //                 // Get item names for selected items
    //                 frappe.call({
    //                     method: 'frappe.client.get_list',
    //                     args: {
    //                         doctype: 'Item',
    //                         filters: {
    //                             'name': ['in', selected_items]
    //                         },
    //                         fields: ['name', 'item_name']
    //                     },
    //                     callback: function(item_response) {
    //                         if (item_response.message) {
    //                             // Get the new component names
    //                             let new_component_names = item_response.message.map(item => item.item_name);
                                
    //                             // Combine with existing components (avoiding duplicates)
    //                             let all_components = [...new Set([...existing_component_names, ...new_component_names])];
    //                             let component_names_string = all_components.join(', ');
                                
    //                             // Update the components field with selected values
    //                             frappe.model.set_value(cdt, cdn, 'component_used', component_names_string);
                                
    //                             // Refresh the field to show updated value
    //                             frm.refresh_field('repair_and_return');
                                
    //                             // Format the newly added components as pills
    //                             setTimeout(() => {
    //                                 format_components_as_pills(frm);
    //                             }, 500);
                                
    //                             // Show success message
    //                             frappe.show_alert({
    //                                 message: __('Components updated successfully'),
    //                                 indicator: 'green'
    //                             });
    //                         }
                            
    //                         // Clear the active dialog flag
    //                         window.activeComponentDialog = null;
                            
    //                         // Hide the dialog
    //                         dialog.hide();
                            
    //                         // Destroy the dialog to ensure clean state
    //                         setTimeout(() => {
    //                             if (dialog && dialog.$wrapper) {
    //                                 dialog.$wrapper.remove();
    //                             }
    //                         }, 100);
    //                     },
    //                     error: function() {
    //                         dialog.processing = false;
    //                         window.activeComponentDialog = null;
    //                     }
    //                 });
    //             },
    //             secondary_action_label: __('Cancel'),
    //             secondary_action: function() {
    //                 window.activeComponentDialog = null;
    //             }
    //         });
            
    //         // Set flag that dialog is open
    //         window.activeComponentDialog = dialog;
            
    //         // If components field already has values, pre-select them
    //         if (existing_component_names.length > 0) {
    //             frappe.call({
    //                 method: 'frappe.client.get_list',
    //                 args: {
    //                     doctype: 'Item',
    //                     filters: {
    //                         'item_name': ['in', existing_component_names]
    //                     },
    //                     fields: ['name', 'item_name']
    //                 },
    //                 callback: function(existing_response) {
    //                     if (existing_response.message) {
    //                         let existing_codes = existing_response.message.map(item => item.name);
    //                         dialog.set_value('selected_components', existing_codes);
    //                     }
    //                 }
    //             });
    //         }
            
    //         // Handle dialog close event
    //         dialog.on_hide = function() {
    //             window.activeComponentDialog = null;
    //         };
            
    //         dialog.show();
    //     } // End of create_components_dialog function
    // },
    





    select_components: function(frm, cdt, cdn) {
        console.log("Select Components clicked");
        let row = locals[cdt][cdn];
        
        // Prevent multiple dialogs by checking if one is already open
        if (window.activeComponentDialog) {
            console.log("Dialog already open");
            return;
        }
        
        // Fetch ONLY items with item_group = 'Components'
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Item',
                filters: {
                    'disabled': 0,
                    'item_group': 'Components' // Only Components
                },
                fields: ['name', 'item_name', 'item_code', 'item_group'],
                limit_page_length: 0,
                order_by: 'item_name asc'
            },
            callback: function(response) {
                // If no Components found, show message
                if (!response.message || response.message.length === 0) {
                    frappe.msgprint(__('No items found with Item Group = "Components"'));
                    return;
                }
                
                console.log("Components fetched:", response.message);
                
                // Create dialog with Components only
                create_components_dialog(response.message);
            },
            error: function(err) {
                console.error("Error fetching components:", err);
                frappe.msgprint(__('Error fetching components'));
            }
        });
        
        // Function to create the dialog
        function create_components_dialog(components_data) {
            // Get existing component names if any
            let existing_component_names = [];
            if (row.component_used) {
                existing_component_names = row.component_used.split(',').map(name => name.trim()).filter(name => name !== '');
            }
            
            console.log("Existing components:", existing_component_names);
            console.log("Available components data:", components_data);
            
            // Create dialog with MultiSelect field
            let dialog = new frappe.ui.Dialog({
                title: __('Add Components'),  // Changed title to "Add"
                size: 'large',
                fields: [
                    {
                        fieldname: 'item_group_filter',
                        fieldtype: 'Link',
                        label: __('Item Group'),
                        options: 'Item Group',
                        default: 'Components',
                        read_only: 1
                    },
                    {
                        fieldname: 'info_text',
                        fieldtype: 'HTML',
                        options: '<div style="margin-bottom: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">' +
                                '<strong>Current components:</strong> ' + 
                                (existing_component_names.length > 0 ? 
                                    '<span style="color: #007bff;">' + existing_component_names.join(', ') + '</span>' : 
                                    '<span style="color: #666;">None</span>') + 
                                '<br><small style="color: #888;">Select additional components to add to the existing ones</small></div>'
                    },
                    {
                        fieldname: 'selected_components',
                        fieldtype: 'MultiSelect',
                        label: __('Select Components to Add'),  // Clear label
                        options: components_data.map(item => ({
                            value: item.name,
                            label: item.item_name + ' (' + item.name + ')'
                        })),
                        reqd: 0
                    }
                ],
                primary_action_label: __('Add Selected'),  // Clear button label
                primary_action: function(values) {
                    // Prevent double-processing
                    if (dialog.processing) {
                        return;
                    }
                    dialog.processing = true;
                    
                    // Get selected items
                    let selected_items = values.selected_components || [];
                    
                    console.log("Selected items to add:", selected_items);
                    
                    // If no items selected, just close
                    if (selected_items.length === 0) {
                        frappe.msgprint(__('No components selected to add'));
                        dialog.hide();
                        cleanup_dialog();
                        return;
                    }
                    
                    // First hide the dialog to remove overlay
                    dialog.hide();
                    
                    // Process the selection after a small delay
                    setTimeout(() => {
                        // Get item names for selected items
                        frappe.call({
                            method: 'frappe.client.get_list',
                            args: {
                                doctype: 'Item',
                                filters: {
                                    'name': ['in', selected_items]
                                },
                                fields: ['name', 'item_name']
                            },
                            callback: function(item_response) {
                                try {
                                    if (item_response.message) {
                                        // Get the new component names
                                        let new_component_names = item_response.message.map(item => item.item_name);
                                        
                                        // COMBINE with existing components (avoiding duplicates)
                                        let all_components = [...new Set([...existing_component_names, ...new_component_names])];
                                        let component_names_string = all_components.join(', ');
                                        
                                        console.log("Adding components. Final list:", component_names_string);
                                        
                                        // Update the components field with combined values
                                        frappe.model.set_value(cdt, cdn, 'component_used', component_names_string);
                                        
                                        // Refresh the field to show updated value
                                        frm.refresh_field('repair_and_return');
                                        
                                        // Format the components as pills
                                        setTimeout(() => {
                                            format_components_as_pills(frm);
                                        }, 500);
                                        
                                        // Show success message with what was added
                                        let added_count = new_component_names.filter(name => !existing_component_names.includes(name)).length;
                                        frappe.show_alert({
                                            message: __('Added ' + added_count + ' new component(s)'),
                                            indicator: 'green',
                                            seconds: 3
                                        });
                                    }
                                } catch (error) {
                                    console.error("Error processing components:", error);
                                    frappe.msgprint(__('Error adding components: ' + error.message));
                                } finally {
                                    // Clean up in all cases
                                    cleanup_dialog();
                                }
                            },
                            error: function(err) {
                                console.error("Error fetching item details:", err);
                                frappe.msgprint(__('Error fetching component details'));
                                cleanup_dialog();
                            }
                        });
                    }, 100);
                },
                secondary_action_label: __('Cancel'),
                secondary_action: function() {
                    cleanup_dialog();
                }
            });
            
            // Function to properly clean up dialog
            function cleanup_dialog() {
                try {
                    // Clear the active dialog flag
                    window.activeComponentDialog = null;
                    
                    // Remove any lingering overlays
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                    
                    // Destroy the dialog completely
                    if (dialog && dialog.$wrapper) {
                        dialog.$wrapper.modal('hide');
                        setTimeout(() => {
                            if (dialog.$wrapper) {
                                dialog.$wrapper.remove();
                            }
                        }, 300);
                    }
                    
                    // Clear any loading indicators
                    frappe.dom.unfreeze();
                    
                    // Ensure the page is interactive
                    $('body').css('pointer-events', 'auto');
                    $('.page-content').css('pointer-events', 'auto');
                } catch (e) {
                    console.error("Error during cleanup:", e);
                }
            }
            
            // Set flag that dialog is open
            window.activeComponentDialog = dialog;
            
            // DO NOT pre-select existing components - we're adding new ones
            // User should only select what they want to ADD
            
            // Handle dialog close event
            dialog.on_hide = function() {
                cleanup_dialog();
            };
            
            // Add escape key handler
            dialog.$wrapper.on('keydown', function(e) {
                if (e.which === 27) { // ESC key
                    cleanup_dialog();
                }
            });
            
            // Show the dialog
            dialog.show();
            
            // Force refresh the multiselect field to ensure dropdown works
            setTimeout(() => {
                if (dialog.fields_dict && dialog.fields_dict.selected_components) {
                    dialog.fields_dict.selected_components.refresh();
                }
            }, 200);
            
            // Safety cleanup after 10 seconds if dialog is still stuck
            setTimeout(() => {
                if (window.activeComponentDialog === dialog) {
                    console.log("Dialog cleanup timeout triggered");
                    cleanup_dialog();
                }
            }, 10000);
        }
    },





    // Individual row material transfer creation - only for that specific row's components
    create_material_receipt: function(frm, cdt, cdn) {
        console.log("Create Material Transfer clicked for individual row");
        let row = locals[cdt][cdn];
        
        // Check if components are selected
        if (!row.component_used) {
            frappe.msgprint(__('Please select components first'));
            return;
        }
        
        // Check if RMA ID exists
        if (!row.rma_id) {
            frappe.msgprint(__('RMA ID is required'));
            return;
        }
        
        // First, save the component_used to RMA BIN
        frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'RMA BIN',
                name: row.rma_id,
                fieldname: {
                    'component_used': row.component_used,
                    'fault_found': row.fault_found,
                    'repaired_date': row.assigned_date,
                    'rma_id_status': row.repair_status  
                }
            },
            callback: function(update_response) {
                console.log("RMA BIN updated with components");
                
                frappe.db.get_doc('RMA BIN', row.rma_id).then(doc => {
                    console.log("Fetched RMA BIN:", doc);

                    // Ensure remarks child table exists
                    if (!doc.remarks) {
                        doc.remarks = [];
                    }

                    // Add a new child row manually
                    doc.remarks.push({
                        repair_remarks: row.repair_remarks,
                        timestamp: frappe.datetime.now_datetime()
                    });

                    if (!doc.rma_status) {
                        doc.rma_status = [];
                    }

                    doc.rma_status.push({
                        repair_status: row.repair_status,
                        timestamp: frappe.datetime.now_datetime()
                    });

                    // Save the updated document back
                    frappe.call({
                        method: 'frappe.client.save',
                        args: {
                            doc: doc
                        },
                        callback: function (save_response) {
                            frappe.show_alert({
                                message: __('Remarks added to RMA BIN: ' + row.rma_id),
                                indicator: 'green'
                            });
                        }
                    });
                });
                
                // After saving to RMA BIN, proceed with creating Stock Entry
                // Parse the component names
                let component_names = row.component_used.split(', ').map(name => name.trim());
                
                // Fetch item details for the components
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Item',
                        filters: {
                            'item_name': ['in', component_names]
                        },
                        fields: ['name', 'item_name', 'item_code', 'stock_uom', 'description', 'valuation_rate']
                    },
                    callback: function(response) {
                        if (!response.message || response.message.length === 0) {
                            frappe.msgprint(__('Could not fetch component details'));
                            return;
                        }
                        
                        console.log("Components fetched:", response.message);
                        
                        // Store items to add after form loads
                        let items_to_add = response.message;
                        
                        // Create new Stock Entry WITHOUT items initially
                        frappe.new_doc('Stock Entry', {
                            stock_entry_type: 'Material Transfer',
                            custom_technician: frm.doc.technician,
                            purpose: 'Material Transfer',
                            custom_customer: row.customer,
                            custom_rma_id: row.rma_id  // Add RMA ID reference for this specific row
                        }, doc => {
                            // Add items after the form is loaded
                            setTimeout(() => {
                                // Get the current form
                                let se_frm = cur_frm;
                                
                                // Clear any existing items
                                se_frm.clear_table('items');
                                
                                // Add each component as a row
                                items_to_add.forEach(function(item) {
                                    let row = se_frm.add_child('items');
                                    row.item_code = item.name;
                                    row.item_name = item.item_name;
                                    row.description = item.description || item.item_name;
                                    row.uom = item.stock_uom || 'Nos';
                                    row.stock_uom = item.stock_uom || 'Nos';
                                    row.s_warehouse = 'Finished Goods - DTPL';  // Source warehouse
                                    row.t_warehouse = 'Repair Floor - DTPL';    // Target warehouse
                                    row.conversion_factor = 1;
                                    row.qty = 1; // Default quantity - user can change this
                                    row.transfer_qty = 1;
                                    row.basic_rate = item.valuation_rate || 0;
                                });
                                
                                // Refresh the items field to show the new rows
                                se_frm.refresh_field('items');
                                frm.save()
                                frappe.show_alert({
                                    message: __('Material Transfer created with ' + items_to_add.length + ' components for RMA: ' + row.rma_id),
                                    indicator: 'blue'
                                });
                            }, 500); // Small delay to ensure form is fully loaded
                        });
                    },
                    error: function(err) {
                        console.error("Error details:", err);
                        frappe.msgprint(__('Error fetching component details'));
                    }
                });
            },
            error: function(err) {
                console.error("Error updating RMA BIN:", err);
                frappe.msgprint(__('Error updating RMA BIN with components: ' + (err.message || err)));
            }
        });
    },
    
    refresh: function(frm) {
        setup_field_filters(frm);
        
        // Fix column header display
        setTimeout(() => {
            let $header = frm.fields_dict.repair_and_return.grid.wrapper.find('.grid-heading-row [data-fieldname="component_used"]');
            if ($header.length) {
                $header.html('Component Used'); // Set proper header text without styling
            }
        }, 500);
        
        // Apply pills formatting when child table refreshes
        setTimeout(() => {
            format_components_as_pills(frm);
        }, 500);
    },

    assigned_to: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.assigned_to) {
            frappe.db.get_doc('Employee', row.assigned_to).then(item => {
                frappe.model.set_value(cdt, cdn, 'employee_name', item.employee_name);
            }).catch(err => {
                console.log('Error fetching employee:', err);
                frappe.model.set_value(cdt, cdn, 'employee_name', '');
            });
        }
    },
    
    // Add this event to reformat components when the field value changes
    component_used: function(frm, cdt, cdn) {
        setTimeout(() => {
            format_components_as_pills(frm);
        }, 500);
    }
});

frappe.form.link_formatters['Employee'] = function(value, doc) {
    if(doc && doc.employee_name && doc.employee_name !== value) {
        return value + " - " + doc.employee_name;
    } else {
        return value;
    }
};