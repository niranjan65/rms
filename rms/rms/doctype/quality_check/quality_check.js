// // Copyright (c) 2025, Anantdv and contributors
// // For license information, please see license.txt



// frappe.ui.form.on('Quality Check', {
//     refresh: function(frm) {
//         console.log("refresh called")
//         // localStorage.setItem("quality_check_snapshot", JSON.stringify(frm.doc.quality_check));
//         // Remove existing Get Data button if it exists
//         if (frm.custom_buttons["Get Data"]) {
//             frm.remove_custom_button("Get Data");
//         }

//         // Add Get Data button
//         frm.add_custom_button(__('Get Data'), function() {
//             load_quality_check_data(frm);
//         }).addClass('btn-primary');

//         // Setup field filters
//         setup_field_filters(frm);
//     },
    

//     customer: function(frm) {
//         // Clear lot_no when customer changes
//         if (frm.doc.lot_no) {
//             frm.set_value('lot_no', '');
//         }
//     },

//     before_save: async function (frm) {
//         console.log("before save called");

//         let oldData = JSON.parse(localStorage.getItem("quality_check_snapshot") || "[]");
//         // console.log("Old Data:", oldData);

//         let local_storage_val = []

//         for (let row of frm.doc.quality_check) {
//             let original = oldData.find(o => o.rma_id === row.rma_id);
//             if (!original) continue;


//             let hasSimpleChange = false;
//             let updates = {};

//             function normalize(val) {
//                 if (val === undefined || val === null) return "";
//                 return val;
//             }

//             if (normalize(row.quality_check_assign_to) !== normalize(original.quality_check_assigned_to?.split(' - ')[0])) {

//                     const qcAssignedData = await parseEmployeeString(row.quality_check_assign_to);
//                     updates.quality_check_assigned_to = `${qcAssignedData.id} - ${qcAssignedData.name}`;
//                     hasSimpleChange = true;
//             }

//             if(row.quality_check_done !==original.quality_check_done){
//                 updates.quality_check_done = row.quality_check_done
//                 hasSimpleChange = true
//             }

//             // console.log("Quality Check Date Update:", row.quality_check_date, ":", updates.quality_check_assigned_date);
//             if(normalize(row.quality_check_date) !== normalize(original.quality_check_assigned_date)){
//                 updates.quality_check_assigned_date = row.quality_check_date
//                 hasSimpleChange = true
//             }

//             if (normalize(row.repair_status) !== normalize(original.rma_id_status)) {
//                 updates.rma_id_status = row.repair_status;
//                 hasSimpleChange = true
//             }

//             if (normalize(row.repair_remarks) !== normalize(original.repair_remarks)) {
//                 updates.repair_remarks = row.repair_remarks;
//                 hasSimpleChange = true
//             }


//             // console.log(original)
//             let hasRepairStatusChanged = normalize(row.repair_status) !== normalize(original?.rma_id_status);
//             let remarksChanged = normalize(row.repair_remarks) !== normalize(original.repair_remarks);
//             console.log("row repair:", row.repair_remarks, "original repair:", original?.repair_remarks);


//             // console.log("Updates for RMA", row.rma_id, ":", updates);

//              // Push updates for simple fields
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

        

//         localStorage.setItem("quality_check_snapshot", JSON.stringify(local_storage_val));
//         await refreshEmployeeDisplayNames(frm, local_storage_val);
//     },
//     onload_post_render: function (frm) {
        

//         localStorage.removeItem("quality_check_snapshot");
        
//         frm.set_value("customer", "")
//         frm.set_value("lot_no", "")
//         frm.clear_table("quality_check");
//         frm.refresh_field("quality_check")
//         // frm.save()
//     },

//  validate: function(frm) {
//         let errors = [];

//         for (let row of frm.doc.quality_check || []) {
//             let assignedToId = row.assigned_to || '';
//             let qcAssignToId = row.quality_check_assign_to || '';

//             if (assignedToId && qcAssignToId && assignedToId === qcAssignToId) {
//                 errors.push(`• RMA ID <b>${row.rma_id || 'Unknown'}</b>: Repair and Quality Check Engineer cannot be the same.`);
//             }
//         }

//         if (errors.length > 0) {
//             frappe.throw(`
//                 <p>Error</p>
//                 ${errors.join("<br>")}
//             `);
//         }
//     },



// });

// function setup_field_filters(frm) {
//     // Set query for Lot No based on Customer
//     frm.set_query("lot_no", function() {
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


// async function parseEmployeeString(employeeString) {
//     if (!employeeString) {
//         return { id: '', name: '' };
//     }
    
//     if (employeeString.includes(' - ')) {
//         const parts = employeeString.split(' - ');
//         return { id: parts[0], name: parts[1] || '' };
//     }
    
//     // If it's just a name or ID, try to fetch the complete data
//     try {
//         // First, try to find by employee name
//         const byNameResult = await frappe.db.get_list('Employee', {
//             filters: [['employee_name', '=', employeeString]],
//             fields: ['name', 'employee_name'],
//             limit: 1
//         });
        
//         if (byNameResult && byNameResult.length > 0) {
//             return { 
//                 id: byNameResult[0].name, 
//                 name: byNameResult[0].employee_name 
//             };
//         }
        
//         // If not found by name, try as ID
//         const byIdResult = await frappe.db.get_value('Employee', employeeString, 'employee_name');
//         if (byIdResult && byIdResult.message && byIdResult.message.employee_name) {
//             return { 
//                 id: employeeString, 
//                 name: byIdResult.message.employee_name 
//             };
//         }
//     } catch (err) {
//         console.error('Error fetching employee data for:', employeeString, err);
//     }
    
//     // If all else fails, return what we have
//     return { id: employeeString, name: '' };
// }

// // async function load_quality_check_data(frm) {

    
// //     // Show loading message
// //     frappe.show_alert({
// //         message: 'Loading RMA data...',
// //         indicator: 'blue'
// //     });

    
// //     frappe.call({
// //         method: "rms.rms.doctype.quality_check.quality_check.get_quality_check_data",
// //         args: {
// //             customer: frm.doc.customer || '',
// //             lot_no: frm.doc.lot_no || '',
// //             warranty_status: frm.doc.warranty_status || '',
// //             circle: frm.doc.circle || ''
// //         },
// //         callback: async function(r) {
// //             console.log("RMA Data Response:", r);
// //             frm.clear_table("quality_check");
// //             frm.refresh_field("quality_check");
// //             if (r.message && r.message.length > 0) {
// //                 frm.clear_table("quality_check");



// //                 // Process each row with proper employee data parsing
// //                 localStorage.setItem("quality_check_snapshot", JSON.stringify(r.message));
// //                 console.log("RMA Data:", r.message);
// //                 for (const row of r.message) {
// //                     let child = frm.add_child("quality_check");

// //                     // Map basic fields from RMA BIN to child table
// //                     child.lot_no = row.lot_no;
// //                     child.rma_id = row.rma_reference || row.rma_id;
// //                     child.customer = (row.customer || '').substring(0, 140);
// //                     child.serial_no = row.serial_no;
// //                     child.warranty_st = row.warranty_status;
// //                     child.repair_status = row.rma_id_status;
// //                     child.repair_remarks = row?.repair_remarks ;
// //                     child.warranty_status = row.warranty_status ;
// //                     child.quality_check_pass = row.quality_check_pass ;
// //                     child.quality_check_done = row.quality_check_done ;

// //                     // Parse Assigned To (repaired_by)
// //                     if (row.repaired_by) {
// //                         const assignedToData = await parseEmployeeString(row.repaired_by);
// //                         child.assigned_to = assignedToData.id;
// //                         child.assigned_to_name = assignedToData.name;
// //                     } else {
// //                         child.assigned_to = '';
// //                         child.assigned_to_name = '';
// //                     }

// //                     // Parse Quality Check Assigned To
// //                     if (row.quality_check_assigned_to && row.quality_check_assigned_to !== null) {
                        
// //                         const qcAssignedData = await parseEmployeeString(row.quality_check_assigned_to);
// //                         console.log("quality check assigned to", row.quality_check_assigned_to, qcAssignedData);
// //                         child.quality_check_assign_to = qcAssignedData.id;
// //                         child.quality_check_assigned_to_name = qcAssignedData.name;
// //                     } else {
// //                         child.quality_check_assign_to = '';
// //                         child.quality_check_assigned_to_name = '';
// //                     }

// //                     // Store the RMA BIN name for updating later
// //                     child.rma_bin_name = row.rma_id;
// //                     child.receiving_remarks = row.receiving_remarks;

// //                     // Existing quality check data if available
// //                     child.quality_check_date = row.quality_check_assigned_date || '';

// //                     if(row.receiving_date) {
// //                         child.receiving_date = row.receiving_date
// //                         let today_date = frappe.datetime.get_today();
// //                     let diff = frappe.datetime.get_diff(today_date, row.receiving_date)
// //                     child.tat = diff
// //                     }

// //                     if(row.quality_check_done_date) {
// //                         child.quality_check_done_date = row.quality_check_done_date
// //                     }
// //                 }

// //                 // Store snapshot in localStorage
// // // let snapshot = r.message.map(row => ({
// // //     rma_id: row.rma_id,
// // //     repair_status: row.repair_status || '',
// // //     repair_remarks: row.repair_remarks || '',
// // //     warranty_status: row.warranty_status || '',
// // //     quality_check_pass: row.quality_check_pass || '',
// // //     quality_check_done: row.quality_check_done || '',
// // //     assigned_to: row.repaired_by || '',
// // //     quality_check_assign_to: row.quality_check_assigned_to || ''
// // // }));





// //                 frm.refresh_field("quality_check");
                
// //                 // Refresh grid to apply formatters
// //                 setTimeout(() => {
// //                     if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
// //                         frm.fields_dict.quality_check.grid.refresh();
// //                     }
// //                 }, 100);

// //                 let filter_info = get_filter_info(frm);
// //                 frappe.show_alert({
// //                     message: `Loaded ${r.message.length} RMA records${filter_info}`,
// //                     indicator: 'green'
// //                 });

// //             } else {
// //                 frm.clear_table("quality_check");
// //                 frm.refresh_field("quality_check");

// //                 let filter_text = get_active_filters(frm);
// //                 frappe.show_alert({
// //                     message: `No RMA data found${filter_text}`,
// //                     indicator: 'orange'
// //                 });
// //             }
// //         },
// //         error: function(r) {
// //             frappe.show_alert({
// //                 message: 'Error loading RMA data',
// //                 indicator: 'red'
// //             });
// //             console.error("Error:", r);
// //         }
// //     });

// // }

// // Updated load_quality_check_data function with new filters
// async function load_quality_check_data(frm) {
//     // Show loading message
//     frappe.show_alert({
//         message: 'Loading RMA data...',
//         indicator: 'blue'
//     });

//     frappe.call({
//         method: "rms.rms.doctype.quality_check.quality_check.get_quality_check_data",
//         args: {
//             customer: frm.doc.customer || '',
//             lot_no: frm.doc.lot_no || '',
//             warranty_status: frm.doc.warranty_status || '',
//             circle: frm.doc.circle || '',
//             rma_id: frm.doc.rma_id || '',           // Added RMA ID filter
//             repair_status: frm.doc.repair_status || ''  // Added Repair Status filter
//         },
//         callback: async function(r) {
//             console.log("RMA Data Response:", r);
//             frm.clear_table("quality_check");
//             frm.refresh_field("quality_check");
            
//             if (r.message && r.message.length > 0) {
//                 frm.clear_table("quality_check");

//                 // Process each row with proper employee data parsing
//                 localStorage.setItem("quality_check_snapshot", JSON.stringify(r.message));
//                 console.log("RMA Data:", r.message);
                
//                 for (const row of r.message) {
//                     let child = frm.add_child("quality_check");

//                     // Map basic fields from RMA BIN to child table
//                     child.lot_no = row.lot_no;
//                     child.rma_id = row.rma_id || row.name;  // Check both fields
//                     child.customer = (row.customer || '').substring(0, 140);
//                     child.serial_no = row.serial_no;
//                     child.warranty_st = row.warranty_status;
//                     child.repair_status = row.rma_id_status;
//                     child.repair_remarks = row?.repair_remarks;
//                     child.warranty_status = row.warranty_status;
//                     child.quality_check_pass = row.quality_check_pass;
//                     child.quality_check_done = row.quality_check_done;

//                     // Parse Assigned To (repaired_by)
//                     if (row.repaired_by) {
//                         const assignedToData = await parseEmployeeString(row.repaired_by);
//                         child.assigned_to = assignedToData.id;
//                         child.assigned_to_name = assignedToData.name;
//                     } else {
//                         child.assigned_to = '';
//                         child.assigned_to_name = '';
//                     }

//                     // Parse Quality Check Assigned To
//                     if (row.quality_check_assigned_to && row.quality_check_assigned_to !== null) {
//                         const qcAssignedData = await parseEmployeeString(row.quality_check_assigned_to);
//                         console.log("quality check assigned to", row.quality_check_assigned_to, qcAssignedData);
//                         child.quality_check_assign_to = qcAssignedData.id;
//                         child.quality_check_assigned_to_name = qcAssignedData.name;
//                     } else {
//                         child.quality_check_assign_to = '';
//                         child.quality_check_assigned_to_name = '';
//                     }

//                     // Store the RMA BIN name for updating later
//                     child.rma_bin_name = row.rma_id || row.name;
//                     child.receiving_remarks = row.receiving_remarks;

//                     // Existing quality check data if available
//                     child.quality_check_date = row.quality_check_assigned_date || '';

//                     if(row.receiving_date) {
//                         child.receiving_date = row.receiving_date;
//                         let today_date = frappe.datetime.get_today();
//                         let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
//                         child.tat = diff;
//                     }

//                     if(row.quality_check_done_date) {
//                         child.quality_check_done_date = row.quality_check_done_date;
//                     }
//                 }

//                 frm.refresh_field("quality_check");
                
//                 // Refresh grid to apply formatters
//                 setTimeout(() => {
//                     if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
//                         frm.fields_dict.quality_check.grid.refresh();
//                     }
//                 }, 100);

//                 let filter_info = get_filter_info(frm);
//                 frappe.show_alert({
//                     message: `Loaded ${r.message.length} RMA records${filter_info}`,
//                     indicator: 'green'
//                 });

//             } else {
//                 frm.clear_table("quality_check");
//                 frm.refresh_field("quality_check");

//                 let filter_text = get_active_filters(frm);
//                 frappe.show_alert({
//                     message: `No RMA data found${filter_text}`,
//                     indicator: 'orange'
//                 });
//             }
//         },
//         error: function(r) {
//             frappe.show_alert({
//                 message: 'Error loading RMA data',
//                 indicator: 'red'
//             });
//             console.error("Error:", r);
//         }
//     });
// }

// // Updated get_active_filters_array function to include new filters
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

// // function get_active_filters(frm) {
// //     let filters = get_active_filters_array(frm);
// //     if (filters.length > 0) {
// //         return ` with filters: ${filters.join(', ')}`;
// //     }
// //     return '';
// // }

// function get_active_filters_array(frm) {
//     let filters = [];
//     if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
//     if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
//     if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
//     if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
//     return filters;
// }

// // Helper function to refresh employee display names after save
// async function refreshEmployeeDisplayNames(frm, updatedData) {
//     for (let row of frm.doc.quality_check) {
//         // Find corresponding updated data
//         let updatedRow = updatedData.find(u => u.rma_id === row.rma_id);
//         if (!updatedRow) continue;

//         // Update assigned_to display name
//         if (updatedRow.repaired_by) {
//             const assignedToData = await parseEmployeeString(updatedRow.repaired_by);
//             row.assigned_to_name = assignedToData.name;
//         }

//         // Update quality_check_assign_to display name
//         if (updatedRow.quality_check_assigned_to) {
//             const qcAssignedData = await parseEmployeeString(updatedRow.quality_check_assigned_to);
//             row.quality_check_assigned_to_name = qcAssignedData.name;
//         }
//     }

//     // Refresh the grid to show updated display names
//     frm.refresh_field("quality_check");
    
//     // Force re-render of grid rows
//     setTimeout(() => {
//         if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
//             frm.fields_dict.quality_check.grid.refresh();
            
//             // Apply custom formatting to each row
//             frm.fields_dict.quality_check.grid.grid_rows.forEach(grid_row => {
//                 if (grid_row.doc.doctype === "Quality Check Table") {
//                     // Update quality_check_assign_to display
//                     if (grid_row.doc.quality_check_assign_to && grid_row.doc.quality_check_assigned_to_name) {
//                         let qc_cell = grid_row.row.find('[data-fieldname="quality_check_assign_to"]');
//                         if (qc_cell.length) {
//                             qc_cell.text(`${grid_row.doc.quality_check_assign_to} - ${grid_row.doc.quality_check_assigned_to_name}`);
//                         }
//                     }
                    
//                     // Update assigned_to display
//                     if (grid_row.doc.assigned_to && grid_row.doc.assigned_to_name) {
//                         let assigned_cell = grid_row.row.find('[data-fieldname="assigned_to"]');
//                         if (assigned_cell.length) {
//                             assigned_cell.text(`${grid_row.doc.assigned_to} - ${grid_row.doc.assigned_to_name}`);
//                         }
//                     }
//                 }
//             });
//         }
//     }, 200);
// }

// // Child table specific events
// frappe.ui.form.on("Quality Check table", {

//      quality_check_assign_to: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         console.log("Hi Happy")
        
//         if (row.quality_check_assign_to) {
//             console.log("Hi Happy444444444")
//             // Set quality_check_date to today when quality_check_assign_to is selected
//             frappe.model.set_value(cdt, cdn, 'quality_check_date', frappe.datetime.get_today());
            
//             frappe.db.get_doc('Employee', row.quality_check_assign_to).then(item => {
//                 frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', item.employee_name);
//             }).catch(err => {
//                 console.log('Error fetching employee:', err);
//                 frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', '');
//             });
//         } else {
//             // Clear quality_check_date if quality_check_assign_to is cleared
//             frappe.model.set_value(cdt, cdn, 'quality_check_date', '');
//         }
//     },
    
//     form_render: function(frm, cdt, cdn) {
//         // Apply formatting when form renders
//         let row = locals[cdt][cdn];
//         let grid_row = frm.fields_dict.quality_check.grid.grid_rows_by_docname[cdn];
        
//         if (grid_row) {
//             // Format quality_check_assign_to display
//             if (row.quality_check_assign_to && row.quality_check_assigned_to_name) {
//                 let field = grid_row.get_field('quality_check_assign_to');
//                 if (field && field.$input) {
//                     field.$input.val(`${row.quality_check_assign_to} - ${row.quality_check_assigned_to_name}`);
//                 }
//             }
            
//             // Format assigned_to display
//             if (row.assigned_to && row.assigned_to_name) {
//                 let field = grid_row.get_field('assigned_to');
//                 if (field && field.$input) {
//                     field.$input.val(`${row.assigned_to} - ${row.assigned_to_name}`);
//                 }
//             }
//         }
//     }
// });


// // frappe.ui.form.on("Quality Check Table", {
    
// //     quality_check_assign_to: function (frm, cdt, cdn) {
// //         let row = locals[cdt][cdn];
// //         console.log("Hi Happy")
        
// //         if (row.quality_check_assign_to) {
// //             console.log("Hi Happy444444444")
// //             // Set quality_check_date to today when quality_check_assign_to is selected
// //             frappe.model.set_value(cdt, cdn, 'quality_check_date', frappe.datetime.get_today());
            
// //             frappe.db.get_doc('Employee', row.quality_check_assign_to).then(item => {
// //                 frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', item.employee_name);
// //             }).catch(err => {
// //                 console.log('Error fetching employee:', err);
// //                 frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', '');
// //             });
// //         } else {
// //             // Clear quality_check_date if quality_check_assign_to is cleared
// //             frappe.model.set_value(cdt, cdn, 'quality_check_date', '');
// //         }
// //     },
    
// //     form_render: function(frm, cdt, cdn) {
// //         // Apply formatting when form renders
// //         let row = locals[cdt][cdn];
// //         let grid_row = frm.fields_dict.quality_check.grid.grid_rows_by_docname[cdn];
        
// //         if (grid_row) {
// //             // Format quality_check_assign_to display
// //             if (row.quality_check_assign_to && row.quality_check_assigned_to_name) {
// //                 let field = grid_row.get_field('quality_check_assign_to');
// //                 if (field && field.$input) {
// //                     field.$input.val(`${row.quality_check_assign_to} - ${row.quality_check_assigned_to_name}`);
// //                 }
// //             }
            
// //             // Format assigned_to display
// //             if (row.assigned_to && row.assigned_to_name) {
// //                 let field = grid_row.get_field('assigned_to');
// //                 if (field && field.$input) {
// //                     field.$input.val(`${row.assigned_to} - ${row.assigned_to_name}`);
// //                 }
// //             }
// //         }
// //     }
// // });

// // Enhanced link formatter for Employee fields
// frappe.form.link_formatters['Employee'] = function(value, doc) {
//     if (!value) return value;
    
//     // Check if this is being called for the assigned_to field
//     if (doc.assigned_to === value && doc.assigned_to_name) {
//         return value + ' - ' + doc.assigned_to_name;
//     }
    
//     // Check if this is being called for the quality_check_assign_to field
//     if (doc.quality_check_assign_to === value && doc.quality_check_assigned_to_name) {
//         return value + ' - ' + doc.quality_check_assigned_to_name;
//     }
    
//     return value;
// };

// // Override grid rendering for better display
// $(document).on('app_ready', function() {
//     // Extend the grid row renderer if available
//     if (frappe.ui.form.GridRow) {
//         const original_render = frappe.ui.form.GridRow.prototype.render_row;
        
//         frappe.ui.form.GridRow.prototype.render_row = function() {
//             original_render.apply(this, arguments);
            
//             // Apply custom formatting for Quality Check child table
//             if (this.doc.doctype === "Quality Check Table") {
//                 // Format quality_check_assign_to column
//                 if (this.doc.quality_check_assign_to && this.doc.quality_check_assigned_to_name) {
//                     let qc_cell = this.row.find('[data-fieldname="quality_check_assign_to"]');
//                     if (qc_cell.length) {
//                         qc_cell.text(`${this.doc.quality_check_assign_to} - ${this.doc.quality_check_assigned_to_name}`);
//                     }
//                 }
                
//                 // Format assigned_to column
//                 if (this.doc.assigned_to && this.doc.assigned_to_name) {
//                     let assigned_cell = this.row.find('[data-fieldname="assigned_to"]');
//                     if (assigned_cell.length) {
//                         assigned_cell.text(`${this.doc.assigned_to} - ${this.doc.assigned_to_name}`);
//                     }
//                 }
//             }
//         };
//     }
// });






function setup_field_filters(frm) {
    frm.set_query("lot_no", function() {
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

function get_active_filters_array(frm) {
    let filters = [];
    if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
    if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
    if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
    if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
    if (frm.doc.rma_id) filters.push(`RMA ID: ${frm.doc.rma_id}`);
    if (frm.doc.repair_status) filters.push(`Status: ${frm.doc.repair_status}`);
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

// Main load function - matching Repair and Return pattern
async function load_quality_check_data(frm) {
    frappe.show_alert({
        message: 'Loading RMA data...',
        indicator: 'blue'
    });

    frappe.call({
        method: "rms.rms.doctype.quality_check.quality_check.get_quality_check_data",
        args: {
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',           // Added RMA ID filter
            repair_status: frm.doc.repair_status || ''  // Added Repair Status filter
        },
        callback: async function(r) {
            console.log("RMA Data Response:", r);
            frm.clear_table("quality_check");
            frm.refresh_field("quality_check");
            
            if (r.message && r.message.length > 0) {
                frm.clear_table("quality_check");
                
                console.log("Loaded RMA data:", r.message);
                localStorage.setItem("quality_check_snapshot", JSON.stringify(r.message));
                
                for (const row of r.message) {
                    let child = frm.add_child("quality_check");

                    // Map basic fields from RMA BIN to child table
                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_id || row.name;
                    child.customer = (row.customer || '').substring(0, 140);
                    child.serial_no = row.serial_no;
                    child.warranty_st = row.warranty_status;
                    child.repair_status = row.rma_id_status;
                    child.repair_remarks = row?.repair_remarks;
                    child.warranty_status = row.warranty_status;
                    child.quality_check_pass = row.quality_check_pass;
                    child.quality_check_done = row.quality_check_done;

                    // Parse Assigned To (repaired_by)
                    if (row.repaired_by) {
                        const assignedToData = await parseEmployeeString(row.repaired_by);
                        child.assigned_to = assignedToData.id;
                        child.assigned_to_name = assignedToData.name;
                    } else {
                        child.assigned_to = '';
                        child.assigned_to_name = '';
                    }

                    // Parse Quality Check Assigned To
                    if (row.quality_check_assigned_to && row.quality_check_assigned_to !== null) {
                        const qcAssignedData = await parseEmployeeString(row.quality_check_assigned_to);
                        console.log("quality check assigned to", row.quality_check_assigned_to, qcAssignedData);
                        child.quality_check_assign_to = qcAssignedData.id;
                        child.quality_check_assigned_to_name = qcAssignedData.name;
                    } else {
                        child.quality_check_assign_to = '';
                        child.quality_check_assigned_to_name = '';
                    }

                    // Store the RMA BIN name for updating later
                    child.rma_bin_name = row.rma_id || row.name;
                    child.receiving_remarks = row.receiving_remarks;

                    // Existing quality check data if available
                    child.quality_check_date = row.quality_check_assigned_date || '';

                    if(row.receiving_date) {
                        child.receiving_date = row.receiving_date;
                        let today_date = frappe.datetime.get_today();
                        let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
                        child.tat = diff;
                    }

                    if(row.quality_check_done_date) {
                        child.quality_check_done_date = row.quality_check_done_date;
                    }
                }

                frm.refresh_field("quality_check");
                
                // Refresh grid to apply formatters
                setTimeout(() => {
                    if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
                        frm.fields_dict.quality_check.grid.refresh();
                    }
                }, 100);

                let filter_info = get_filter_info(frm);
                frappe.show_alert({
                    message: `Loaded ${r.message.length} RMA records${filter_info}`,
                    indicator: 'green'
                });

            } else {
                frm.clear_table("quality_check");
                frm.refresh_field("quality_check");

                let filter_text = get_active_filters(frm);
                frappe.show_alert({
                    message: `No RMA data found${filter_text}`,
                    indicator: 'orange'
                });
            }
        },
        error: function(r) {
            console.error("Error loading RMA data:", r);
            frappe.show_alert({
                message: 'Error loading RMA data',
                indicator: 'red'
            });
        }
    });
}

// Helper function to refresh employee display names after save
async function refreshEmployeeDisplayNames(frm, updatedData) {
    for (let row of frm.doc.quality_check) {
        let updatedRow = updatedData.find(u => u.rma_id === row.rma_id);
        if (!updatedRow) continue;

        if (updatedRow.repaired_by) {
            const assignedToData = await parseEmployeeString(updatedRow.repaired_by);
            row.assigned_to_name = assignedToData.name;
        }

        if (updatedRow.quality_check_assigned_to) {
            const qcAssignedData = await parseEmployeeString(updatedRow.quality_check_assigned_to);
            row.quality_check_assigned_to_name = qcAssignedData.name;
        }
    }

    frm.refresh_field("quality_check");
    
    setTimeout(() => {
        if (frm.fields_dict.quality_check && frm.fields_dict.quality_check.grid) {
            frm.fields_dict.quality_check.grid.refresh();
            
            frm.fields_dict.quality_check.grid.grid_rows.forEach(grid_row => {
                if (grid_row.doc.doctype === "Quality Check Table") {
                    if (grid_row.doc.quality_check_assign_to && grid_row.doc.quality_check_assigned_to_name) {
                        let qc_cell = grid_row.row.find('[data-fieldname="quality_check_assign_to"]');
                        if (qc_cell.length) {
                            qc_cell.text(`${grid_row.doc.quality_check_assign_to} - ${grid_row.doc.quality_check_assigned_to_name}`);
                        }
                    }
                    
                    if (grid_row.doc.assigned_to && grid_row.doc.assigned_to_name) {
                        let assigned_cell = grid_row.row.find('[data-fieldname="assigned_to"]');
                        if (assigned_cell.length) {
                            assigned_cell.text(`${grid_row.doc.assigned_to} - ${grid_row.doc.assigned_to_name}`);
                        }
                    }
                }
            });
        }
    }, 200);
}

async function parseEmployeeString(employeeString) {
    if (!employeeString) {
        return { id: '', name: '' };
    }
    
    if (employeeString.includes(' - ')) {
        const parts = employeeString.split(' - ');
        return { id: parts[0], name: parts[1] || '' };
    }
    
    try {
        const byNameResult = await frappe.db.get_list('Employee', {
            filters: [['employee_name', '=', employeeString]],
            fields: ['name', 'employee_name'],
            limit: 1
        });
        
        if (byNameResult && byNameResult.length > 0) {
            return { 
                id: byNameResult[0].name, 
                name: byNameResult[0].employee_name 
            };
        }
        
        const byIdResult = await frappe.db.get_value('Employee', employeeString, 'employee_name');
        if (byIdResult && byIdResult.message && byIdResult.message.employee_name) {
            return { 
                id: employeeString, 
                name: byIdResult.message.employee_name 
            };
        }
    } catch (err) {
        console.error('Error fetching employee data for:', employeeString, err);
    }
    
    return { id: employeeString, name: '' };
}

// Main form events
frappe.ui.form.on('Quality Check', {
    refresh: function(frm) {
        console.log("refresh called")
        
        // Remove existing Get Data button if it exists
        if (frm.custom_buttons["Get Data"]) {
            frm.remove_custom_button("Get Data");
        }

        // Add Get Data button
        frm.add_custom_button(__('Get Data'), function() {
            load_quality_check_data(frm);
        }).addClass('btn-primary');

        // Setup field filters
        setup_field_filters(frm);
    },
    
    customer: function(frm) {
        // Clear lot_no when customer changes
        if (frm.doc.lot_no) {
            frm.set_value('lot_no', '');
        }
    },
    
    // Add RMA ID field event handler
    rma_id: function(frm) {
        console.log("RMA ID changed to:", frm.doc.rma_id);
    },

    before_save: async function (frm) {
        console.log("before save called");

        let oldData = JSON.parse(localStorage.getItem("quality_check_snapshot") || "[]");
        let local_storage_val = []

        for (let row of frm.doc.quality_check) {
            let original = oldData.find(o => o.rma_id === row.rma_id);
            if (!original) continue;

            let hasSimpleChange = false;
            let updates = {};

            function normalize(val) {
                if (val === undefined || val === null) return "";
                return val;
            }

            if (normalize(row.quality_check_assign_to) !== normalize(original.quality_check_assigned_to?.split(' - ')[0])) {
                const qcAssignedData = await parseEmployeeString(row.quality_check_assign_to);
                updates.quality_check_assigned_to = `${qcAssignedData.id} - ${qcAssignedData.name}`;
                hasSimpleChange = true;
            }

            if(row.quality_check_done !== original.quality_check_done){
                updates.quality_check_done = row.quality_check_done
                hasSimpleChange = true
            }

            if(normalize(row.quality_check_date) !== normalize(original.quality_check_assigned_date)){
                updates.quality_check_assigned_date = row.quality_check_date
                hasSimpleChange = true
            }

            if (normalize(row.repair_status) !== normalize(original.rma_id_status)) {
                updates.rma_id_status = row.repair_status;
                hasSimpleChange = true
            }

            if (normalize(row.repair_remarks) !== normalize(original.repair_remarks)) {
                updates.repair_remarks = row.repair_remarks;
                hasSimpleChange = true
            }

            let hasRepairStatusChanged = normalize(row.repair_status) !== normalize(original?.rma_id_status);
            let remarksChanged = normalize(row.repair_remarks) !== normalize(original.repair_remarks);
            console.log("row repair:", row.repair_remarks, "original repair:", original?.repair_remarks);

            // Push updates for simple fields
            if (hasSimpleChange) {
                await frappe.db.set_value("RMA BIN", row.rma_id, updates);
            }

            // Handle remarks separately (child table)
            if (remarksChanged) {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
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

            if (hasRepairStatusChanged) {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
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

        localStorage.setItem("quality_check_snapshot", JSON.stringify(local_storage_val));
        await refreshEmployeeDisplayNames(frm, local_storage_val);
    },
    
    onload_post_render: function (frm) {
        localStorage.removeItem("quality_check_snapshot");
        
        frm.set_value("customer", "")
        frm.set_value("lot_no", "")
        frm.clear_table("quality_check");
        frm.refresh_field("quality_check")
    },

    validate: function(frm) {
        let errors = [];

        for (let row of frm.doc.quality_check || []) {
            let assignedToId = row.assigned_to || '';
            let qcAssignToId = row.quality_check_assign_to || '';

            if (assignedToId && qcAssignToId && assignedToId === qcAssignToId) {
                errors.push(`• RMA ID <b>${row.rma_id || 'Unknown'}</b>: Repair and Quality Check Engineer cannot be the same.`);
            }
        }

        if (errors.length > 0) {
            frappe.throw(`
                <p>Error</p>
                ${errors.join("<br>")}
            `);
        }
    }
});

// Child table specific events
frappe.ui.form.on("Quality Check Table", {
    quality_check_assign_to: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        console.log("Hi Happy")
        
        if (row.quality_check_assign_to) {
            console.log("Hi Happy444444444")
            // Set quality_check_date to today when quality_check_assign_to is selected
            frappe.model.set_value(cdt, cdn, 'quality_check_date', frappe.datetime.get_today());
            
            frappe.db.get_doc('Employee', row.quality_check_assign_to).then(item => {
                frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', item.employee_name);
            }).catch(err => {
                console.log('Error fetching employee:', err);
                frappe.model.set_value(cdt, cdn, 'quality_check_assigned_to_name', '');
            });
        } else {
            // Clear quality_check_date if quality_check_assign_to is cleared
            frappe.model.set_value(cdt, cdn, 'quality_check_date', '');
        }
    },
    
    form_render: function(frm, cdt, cdn) {
        // Apply formatting when form renders
        let row = locals[cdt][cdn];
        let grid_row = frm.fields_dict.quality_check.grid.grid_rows_by_docname[cdn];
        
        if (grid_row) {
            // Format quality_check_assign_to display
            if (row.quality_check_assign_to && row.quality_check_assigned_to_name) {
                let field = grid_row.get_field('quality_check_assign_to');
                if (field && field.$input) {
                    field.$input.val(`${row.quality_check_assign_to} - ${row.quality_check_assigned_to_name}`);
                }
            }
            
            // Format assigned_to display
            if (row.assigned_to && row.assigned_to_name) {
                let field = grid_row.get_field('assigned_to');
                if (field && field.$input) {
                    field.$input.val(`${row.assigned_to} - ${row.assigned_to_name}`);
                }
            }
        }
    }
});

// Enhanced link formatter for Employee fields
frappe.form.link_formatters['Employee'] = function(value, doc) {
    if (!value) return value;
    
    // Check if this is being called for the assigned_to field
    if (doc.assigned_to === value && doc.assigned_to_name) {
        return value + ' - ' + doc.assigned_to_name;
    }
    
    // Check if this is being called for the quality_check_assign_to field
    if (doc.quality_check_assign_to === value && doc.quality_check_assigned_to_name) {
        return value + ' - ' + doc.quality_check_assigned_to_name;
    }
    
    return value;
};

// Override grid rendering for better display
$(document).on('app_ready', function() {
    // Extend the grid row renderer if available
    if (frappe.ui.form.GridRow) {
        const original_render = frappe.ui.form.GridRow.prototype.render_row;
        
        frappe.ui.form.GridRow.prototype.render_row = function() {
            original_render.apply(this, arguments);
            
            // Apply custom formatting for Quality Check child table
            if (this.doc.doctype === "Quality Check Table") {
                // Format quality_check_assign_to column
                if (this.doc.quality_check_assign_to && this.doc.quality_check_assigned_to_name) {
                    let qc_cell = this.row.find('[data-fieldname="quality_check_assign_to"]');
                    if (qc_cell.length) {
                        qc_cell.text(`${this.doc.quality_check_assign_to} - ${this.doc.quality_check_assigned_to_name}`);
                    }
                }
                
                // Format assigned_to column
                if (this.doc.assigned_to && this.doc.assigned_to_name) {
                    let assigned_cell = this.row.find('[data-fieldname="assigned_to"]');
                    if (assigned_cell.length) {
                        assigned_cell.text(`${this.doc.assigned_to} - ${this.doc.assigned_to_name}`);
                    }
                }
            }
        };
    }
});