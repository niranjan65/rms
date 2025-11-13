


frappe.ui.form.on('Repair and Return', {
    refresh: function(frm) {
        // let child_table = frm.fields_dict['repair_and_return'].grid.wrapper;
        // console.log(child_table);

        

        if (frm.custom_buttons["Get Data"]) {
            frm.remove_custom_button("Get Data");
        }
        
        frm.add_custom_button(__('Get Data'), function() {
            load_and_filter_rma_data(frm);
        //      setTimeout(() => {
        //     frm.color_child_table_rows();
        // }, 500);
            
        }).addClass('btn-primary');
        
        setup_field_filters(frm);
    },
    
    setup: function(frm) { 
        if (frm.doc.customer) {
            frm.set_value('customer', '');
        }
    },
    
    customer: function(frm) {
        if (frm.doc.lot_no) {
            frm.set_value('lot_no', '');
        }
    },

    before_save: async function (frm) {
        let oldData = JSON.parse(localStorage.getItem("repair_and_return_snapshot") || "[]");

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

            if (row.assigned_to !== original.repaired_by?.split(' - ')[0]) {


                if (!(original.repaired_by == null && row.assigned_to === "")) {
                    updates.repaired_by = row.assigned_to;
                    hasSimpleChange = true;
                }
            }

            if (row.component_used !== original.component_used) {
                // Special case ignore: null vs ""
                if (!(original.component_used == null && row.component_used === "")) {
                    // console.log("component changes", original);
                    updates.component_used = row.component_used;
                    hasSimpleChange = true;
                }
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

            if(normalize(row.assigned_date) !== normalize(original.rma_assigned_date)){
                updates.rma_assigned_date = row.assigned_date
                hasSimpleChange = true
            }

            if(normalize(row.repaired_date) !== normalize(original.repaired_date)){
                updates.repaired_date = row.repaired_date
                hasSimpleChange = true
            }





            // let hasRepairStatusChanged = row.repair_status !== original.rma_status[original.rma_status.length - 1]?.repair_status;
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
        localStorage.setItem("repair_and_return_snapshot", JSON.stringify(local_storage_val));

        // Update snapshot after save
        
    },
     onload_post_render: function (frm) {

        localStorage.removeItem("repair_and_return_snapshot");
        
        frm.set_value("customer", "")
        frm.set_value("lot_no", "")
        frm.set_value("warranty_status", "")
        frm.set_value("circle", "")
        frm.clear_table("repair_and_return");
        frm.refresh_field("repair_and_return")
        // frm.save()
    },
    
    // before_save function removed - ab sirf Python mein handle hoga
});

frappe.ui.form.on('Repair and Return Table', {
    // assigned_to: function (frm, cdt, cdn) {
    //     let row = locals[cdt][cdn];
        
    //     if (row.assigned_to) {
    //         frappe.db.get_doc('Employee', row.assigned_to).then(item => {
    //             frappe.model.set_value(cdt, cdn, 'employee_name', item.employee_name);
    //         }).catch(err => {
    //             console.log('Error fetching employee:', err);
    //             frappe.model.set_value(cdt, cdn, 'employee_name', '');
    //         });
    //     }
    // },
     assigned_to: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.assigned_to) {
            // Set assigned_date to today when assigned_to is selected
            frappe.model.set_value(cdt, cdn, 'assigned_date', frappe.datetime.get_today());
            
            frappe.db.get_doc('Employee', row.assigned_to).then(item => {
                frappe.model.set_value(cdt, cdn, 'employee_name', item.employee_name);
            }).catch(err => {
                console.log('Error fetching employee:', err);
                frappe.model.set_value(cdt, cdn, 'employee_name', '');
            });
        } else {
            // Clear assigned_date if assigned_to is cleared
            frappe.model.set_value(cdt, cdn, 'assigned_date', '');
        }
    },
    
    
});

// async function refreshEmployeeDisplayNames(frm, updatedData) {
//     for (let row of frm.doc.repair_and_return) {
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
//     frm.refresh_field("repair_and_return");
    
//     // Force re-render of grid rows
//     setTimeout(() => {
//         if (frm.fields_dict.repair_and_return && frm.fields_dict.repair_and_return.grid) {
//             frm.fields_dict.repair_and_return.grid.refresh();
            
//             // Apply custom formatting to each row
//             frm.fields_dict.repair_and_return.grid.grid_rows.forEach(grid_row => {
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

async function parseEmployeeString(employeeString) {
    if (!employeeString) {
        return { id: '', name: '' };
    }
    
    // Check if it's already in "ID - Name" format
    if (employeeString.includes(' - ')) {
        const parts = employeeString.split(' - ');
        return { id: parts[0], name: parts[1] || '' };
    }
    
    // If it's just a name or ID, try to fetch the complete data
    try {
        // First, try to find by employee name
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
        
        // If not found by name, try as ID
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
    
    // If all else fails, return what we have
    return { id: employeeString, name: '' };
}

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

// Helper function to extract employee ID from formatted string
function extract_employee_id(repaired_by_value) {
    if (!repaired_by_value) return '';
    
    // If the value contains " - ", extract the part before it
    if (repaired_by_value.includes(' - ')) {
        return repaired_by_value.split(' - ')[0].trim();
    }
    
    // Otherwise, return the value as is
    return repaired_by_value.trim();
}

// function load_and_filter_rma_data(frm) {
//     frappe.show_alert({
//         message: 'Loading RMA data...',
//         indicator: 'blue'
//     });
    
//     frappe.call({
//         method: "rms.rms.doctype.repair_and_return.repair_and_return.get_filtered_rma_data",
//         args: {
//             customer: frm.doc.customer || '',
//             lot_no: frm.doc.lot_no || '',
//             warranty_status: frm.doc.warranty_status || '',
//             circle: frm.doc.circle || ''
//         },
//         callback: async function(r) {
//             frm.clear_table("repair_and_return");
//             frm.refresh_field("repair_and_return");
            
//             console.log(r.message)
//             if (r.message && r.message.length > 0) {
//                 frm.clear_table("repair_and_return");

//                 console.log("Loaded RMA data:", r.message);
//                localStorage.setItem("repair_and_return_snapshot", JSON.stringify(r.message));
//                 r.message.forEach( async function(row) {
//                     let child = frm.add_child("repair_and_return");
                    
//                     child.lot_no = row.lot_no;
//                     child.rma_id = row.rma_reference || row.rma_id;
//                     child.customer = row.customer;
//                     child.receiving_remarks = row.receiving_remarks || '';
                    
//                     // Extract only employee ID from repaired_by for assigned_to field
//                     if(row.repaired_by) {
                        
//                         child.assigned_to = extract_employee_id(row.repaired_by);
//                         child.assigned_to_name = row.repaired_by;
//                         child.employee_name = row.repaired_by.split(' - ')[1]
                        
//                     }
                    
//                     child.make = row.make;
//                     child.model_no = row.model_no;
//                     child.part_no = row.part_no;
//                     child.serial_no = row.serial_no;
//                     child.warranty_st = row.warranty_status;
//                     child.warranty_status = row.warranty_status;
//                     child.circle = row.circle;
//                     child.lr_no = row.lr_no;
//                     child.delivery_challan_no = row.delivery_challan_no;
//                     child.receiving_date = row.receiving_date;
//                     child.assigned_date = row.rma_assigned_date;
//                     child.component_used = row.component_used || '';
//                     child.repair_status = row?.rma_id_status
//                     child.repair_remarks = row?.remarks[row?.remarks.length-1]?.repair_remarks

//                     if(row.fault_found){
//                         child.fault_found = row.fault_found
//                     }

//                     if(row.receiving_date) {
//                         let today_date = frappe.datetime.get_today();
//                     let diff = frappe.datetime.get_diff(today_date, row.receiving_date)
//                     child.tat = diff
//                     }

//                     if(row.repaired_date) {
//                         child.repaired_date = row.repaired_date
//                     }
                    
                    
//                 });
                
//                 frm.refresh_field("repair_and_return");

//                 // frm.save()
                
//                 let filter_info = get_filter_info(frm);
//                 frappe.show_alert({
//                     message: `Loaded ${r.message.length} RMA records${filter_info}`,
//                     indicator: 'green'
//                 });
                
//             } else {
//                 frm.clear_table("repair_and_return");
//                 frm.refresh_field("repair_and_return");
                
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
//         }
//     });

    
// }

// Replace the existing load_and_filter_rma_data function with this updated version

function load_and_filter_rma_data(frm) {
    frappe.show_alert({
        message: 'Loading RMA data...',
        indicator: 'blue'
    });
    
    frappe.call({
        method: "rms.rms.doctype.repair_and_return.repair_and_return.get_filtered_rma_data",
        args: {
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',           // Added RMA ID filter
            repair_status: frm.doc.repair_status || ''  // Added Repair Status filter
        },
        callback: async function(r) {
            frm.clear_table("repair_and_return");
            frm.refresh_field("repair_and_return");
            
            console.log(r.message)
            if (r.message && r.message.length > 0) {
                frm.clear_table("repair_and_return");

                console.log("Loaded RMA data:", r.message);
                localStorage.setItem("repair_and_return_snapshot", JSON.stringify(r.message));
                
                r.message.forEach(async function(row) {
                    let child = frm.add_child("repair_and_return");
                    
                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_reference || row.rma_id || row.name;  // Check multiple fields
                    child.customer = row.customer;
                    child.receiving_remarks = row.receiving_remarks || '';
                    
                    // Extract only employee ID from repaired_by for assigned_to field
                    if(row.repaired_by) {
                        child.assigned_to = extract_employee_id(row.repaired_by);
                        child.assigned_to_name = row.repaired_by;
                        child.employee_name = row.repaired_by.split(' - ')[1]
                    }
                    
                    child.make = row.make;
                    child.model_no = row.model_no;
                    child.part_no = row.part_no;
                    child.serial_no = row.serial_no;
                    child.warranty_st = row.warranty_status;
                    child.warranty_status = row.warranty_status;
                    child.circle = row.circle;
                    child.lr_no = row.lr_no;
                    child.delivery_challan_no = row.delivery_challan_no;
                    child.receiving_date = row.receiving_date;
                    child.assigned_date = row.rma_assigned_date;
                    child.component_used = row.component_used || '';
                    child.repair_status = row?.rma_id_status;
                    
                    // Get the latest repair remark
                    if (row.remarks && row.remarks.length > 0) {
                        // Get the last remark (most recent)
                        child.repair_remarks = row.remarks[row.remarks.length - 1]?.repair_remarks || row.remarks[row.remarks.length - 1]?.remark;
                    }

                    if(row.fault_found){
                        child.fault_found = row.fault_found;
                    }

                    if(row.receiving_date) {
                        let today_date = frappe.datetime.get_today();
                        let diff = frappe.datetime.get_diff(today_date, row.receiving_date);
                        child.tat = diff;
                    }

                    if(row.repaired_date) {
                        child.repaired_date = row.repaired_date;
                    }
                });
                
                frm.refresh_field("repair_and_return");
                
                let filter_info = get_filter_info(frm);
                frappe.show_alert({
                    message: `Loaded ${r.message.length} RMA records${filter_info}`,
                    indicator: 'green'
                });
                
            } else {
                frm.clear_table("repair_and_return");
                frm.refresh_field("repair_and_return");
                
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

function get_active_filters_array(frm) {
    let filters = [];
    if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
    if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
    if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
    if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
    return filters;
}

frappe.form.link_formatters['Employee'] = function(value, doc) {
    if(doc && doc.employee_name && doc.employee_name !== value) {
        return value + " - " + doc.employee_name;
    } else {
        return value;
    }
};

// frappe.ui.form.Form.prototype.color_child_table_rows = function() {
//     let me = this;
    
//     // Replace 'items' with your child table fieldname
//     if (me.fields_dict['repair_and_return'] && me.fields_dict['repair_and_return'].grid) {
//         me.fields_dict['repair_and_return'].grid.grid_rows.forEach(function(row) {
            
//             if (row.doc) {
//                 let row_element = $(row.wrapper);
//                 console.log(row_element)
//                 row_element.css('background-color', '#d4edda');
                
//                 // Example conditions - customize as needed
//                 if (row.doc.docstatus > 10) {
//                     // Green for high quantity
//                     row_element.css('background-color', '#d4edda');
//                 } else if (row.doc.docstatus < 5) {
//                     // Red for low quantity
//                     row_element.css('background-color', '#97020eff');
//                 } else if (row.doc.rate > 1000) {
//                     // Yellow for high rate
//                     row_element.css('background-color', '#fff3cd');
//                 } else {
//                     // Default/reset color
//                     row_element.css('background-color', '');
//                 }
//             }
//         });
//     }
// };