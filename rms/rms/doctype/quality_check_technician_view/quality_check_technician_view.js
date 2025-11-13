

// frappe.ui.form.on('Quality Check Technician View', {
//     refresh: function (frm) {
//         // Set current technician on form load
//         set_current_technician(frm);

//         if(frm.doc.technician){
//             load_technician_quality_check_data(frm);
//         }
        
//         // Remove existing Get Data button if present
//         if (frm.custom_buttons["Get Data"]) {
//             frm.remove_custom_button("Get Data");
//         }

//         // Add Get Data button
//         frm.add_custom_button(__('Get Data'), function () {
//             load_technician_quality_check_data(frm);
//         }).addClass('btn-primary');

//         // Setup field filters
//         setup_field_filters(frm);
//     },

//     customer: function (frm) {
//         // Clear lot_no when customer changes
//         if (frm.doc.lot_no) {
//             frm.set_value('lot_no', '');
//         }
//     },
    
//     // Add RMA ID field event handler
//     rma_id: function(frm) {
//         console.log("RMA ID changed to:", frm.doc.rma_id);
//     },

//     technician: function (frm) {
//         let employee_id = frm.doc.technician;
        
//         if (employee_id && employee_id.includes(' - ')) {
//             employee_id = employee_id.split(' - ')[0];
//         }

//         // Format technician field with employee name if not already formatted
//         if (frm.doc.technician && !frm.doc.technician.includes(' - ')) {
//             frappe.db.get_value('Employee', employee_id, ['employee', 'employee_name'])
//                 .then(r => {
//                     if (r.message) {
//                         const { employee, employee_name } = r.message;
//                         frm.set_value('technician', `${employee} - ${employee_name}`);
//                     }
//                 })
//                 .catch(err => {
//                     console.error('Error fetching employee:', err);
//                     frappe.msgprint(`Employee ${employee_id} not found`);
//                 });
//         }
//     },

//     before_save: async function (frm) {
//         let oldData = JSON.parse(localStorage.getItem("quality_check_tech_view_snapshot") || "[]");

//         for (let row of frm.doc.quality_check_technician_view_table) {
//             let original = oldData.find(o => o.rma_id === row.rma_id);
//             if (!original) continue;

//             let hasSimpleChange = false;
//             let updates = {};
//             function normalize(val) {
//                 if (val === undefined || val === null) return "";
//                 return val;
//             }

//             let hasRepairStatusChanged = normalize(row.status) !== normalize(original.rma_id_status);
//             let remarksChanged = normalize(row.repair_remarks) !== normalize(original.remarks[original.remarks.length - 1]?.repair_remarks);

//             if (normalize(row.status) !== normalize(original.rma_id_status)) {
//                 updates.rma_id_status = row.status;
//                 hasSimpleChange = true
//             }

//             if(row.quality_check_done !== original.quality_check_done) {
//                 hasSimpleChange = true;
//                 updates.quality_check_done = row.quality_check_done;
//             }

//             if(normalize(row.quality_check_date) !== normalize(original.quality_check_done_date)) {
//                 hasSimpleChange = true;
//                 updates.quality_check_done_date = row.quality_check_date;
//             }

//             if(row.quality_check_pass !== original.quality_check_pass) {
//                 hasSimpleChange = true;
//                 updates.quality_check_pass = row.quality_check_pass;
//             }

//             console.log("Updates for RMA", row.rma_id, ":", updates);

//             if(hasSimpleChange) {
//                 await frappe.db.set_value('RMA BIN', row.rma_id, updates);
//             }

//             if (hasRepairStatusChanged) {
//                 let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
//                 rmaDoc.rma_status.push({
//                     repair_status: row.status,
//                     timestamp: frappe.datetime.now_datetime()
//                 });
//                 rmaDoc.last_updated_on = frappe.datetime.now_datetime();
//                 await frappe.call({
//                     method: "frappe.client.save",
//                     args: { doc: rmaDoc }
//                 });
//             }

//             if (remarksChanged) {
//                 let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
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

//             localStorage.setItem("quality_check_tech_view_snapshot", JSON.stringify(frm.doc.quality_check_technician_view_table));
//         }
//     },
    
//     onload_post_render: function (frm) {
//         localStorage.removeItem("quality_check_tech_view_snapshot");
//         frm.set_value("customer", "")
//         frm.set_value("lot_no", "")
//         frm.clear_table("quality_check_technician_view_table");
//         frm.refresh_field("quality_check_technician_view_table")
//     },
// });

// function set_current_technician(frm) {
//     let current_user = frappe.session.user;

//     frappe.call({
//         method: "frappe.client.get_list",
//         args: {
//             doctype: "Employee",
//             filters: {
//                 'prefered_email': current_user
//             },
//             fields: ['name', 'employee', 'employee_name'],
//             limit_page_length: 1
//         },
//         callback: function (r) {
//             console.log("Employee data:", r.message);
//             if (r.message && r.message.length > 0) {
//                 let employee_data = r.message[0];
//                 let employee_id = employee_data.name;
//                 let employee_name = employee_data.employee_name || '';
                
//                 // Set technician field with employee name format
//                 frm.set_value('technician', `${employee_id} - ${employee_name}`);
//             }
//         },
//         error: function(err) {
//             console.error("Error fetching current user employee:", err);
//         }
//     });
// }

// function setup_field_filters(frm) {
//     // Set filter for lot_no based on customer
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

// function load_technician_quality_check_data(frm) {
//     if (!frm.doc.technician) {
//         frappe.show_alert({
//             message: 'Technician field is required',
//             indicator: 'red'
//         });
//         return;
//     }

//     frappe.show_alert({
//         message: 'Loading Quality Check data...',
//         indicator: 'blue'
//     });

//     // Updated to include rma_id parameter
//     frappe.call({
//         method: "rms.rms.doctype.quality_check_technician_view.quality_check_technician_view.get_technician_quality_check_data",
//         args: {
//             technician: frm.doc.technician,
//             customer: frm.doc.customer || '',
//             lot_no: frm.doc.lot_no || '',
//             warranty_status: frm.doc.warranty_status || '',
//             circle: frm.doc.circle || '',
//             rma_id: frm.doc.rma_id || ''  // Added RMA ID filter
//         },
//         callback: function (r) {
//             frm.clear_table('quality_check_technician_view_table')
//             frm.clear_table("quality_check_technician_view_table");
            
//             if (r.message && r.message.length > 0) {
//                 // Clear existing table data
//                 frm.clear_table("quality_check_technician_view_table");

//                 localStorage.setItem("quality_check_tech_view_snapshot", JSON.stringify(r.message));

//                 r.message.forEach(function (row) {
//                     console.log("RMA BIN row:", row);
//                     let child = frm.add_child("quality_check_technician_view_table");

//                     // Map the basic fields
//                     child.lot_no = row.lot_no;
//                     child.rma_id = row.rma_id || row.name;  // Ensure RMA ID is populated
//                     child.assigned_to = row.repaired_by?.split(" - ")[0];
                    
//                     frappe.db.get_value('Employee', child.assigned_to, 'employee_name').then(r => {
//                         if (r.message) {
//                             child.assigned_to_name = r.message.employee_name;
//                             frm.refresh_field("quality_check_technician_view_table");
//                         }
//                     });

//                     child.quality_check_assigned_to = row.quality_check_assigned_to?.split(" - ")[0];
//                     child.quality_check_assigned_to_name = row.quality_check_assigned_to?.split(" - ")[1];
//                     child.customer = row.customer;
//                     child.model_no = row.model_no;
//                     child.part_no = row.part_no;
//                     child.serial_no = row.serial_no;
//                     child.assigned_date = row.assigned_date;
//                     child.component_used = row.components_used
                    
//                     // Conditionally set quality check fields only if they exist in RMA BIN
//                     if (row.quality_check_assigned_date) {
//                         child.quality_check_assigned_date = row.quality_check_assigned_date;
//                     }

//                     if (row.rma_assigned_date) {
//                         child.assigned_date = row.rma_assigned_date;
//                     }
                    
//                     if (row.quality_check_done_date) {
//                         child.quality_check_date = row.quality_check_done_date;
//                     }

//                     if(row.quality_check_done){
//                         child.quality_check_done = row.quality_check_done
//                     }
                    
//                     child.component_used = row.component_used || '';
//                     child.material_receipt = row.material_receipt || '';
//                     child.repair_remarks = row.remarks[row.remarks.length - 1]?.repair_remarks || '';
//                     child.fault_found = row.receiving_remarks || '';
//                     child.status = row.rma_id_status;
//                     child.quality_check_pass = row.quality_check_pass;
                    
//                     if(row.receiving_date) {
//                         child.receiving_date = row.receiving_date
//                         let today_date = frappe.datetime.get_today();
//                         let diff = frappe.datetime.get_diff(today_date, row.receiving_date)
//                         child.tat = diff
//                     }
//                 });

//                 frm.refresh_field("quality_check_technician_view_table");

//                 let filter_info = get_filter_info(frm);
//                 frappe.show_alert({
//                     message: `Loaded ${r.message.length} RMA BIN records${filter_info}`,
//                     indicator: 'green'
//                 });

//             } else {
//                 frm.clear_table("quality_check_technician_view_table");
//                 frm.refresh_field("quality_check_technician_view_table");

//                 let filter_text = get_active_filters(frm);
//                 frappe.show_alert({
//                     message: `No RMA BIN data found${filter_text}`,
//                     indicator: 'orange'
//                 });
//             }
//         },
//         error: function (r) {
//             console.error("Error loading RMA BIN data:", r);
//             frappe.show_alert({
//                 message: 'Error loading RMA BIN data',
//                 indicator: 'red'
//             });
//         }
//     });
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

// function get_active_filters_array(frm) {
//     let filters = [];
//     if (frm.doc.customer) filters.push(`Customer: ${frm.doc.customer}`);
//     if (frm.doc.lot_no) filters.push(`Lot No: ${frm.doc.lot_no}`);
//     if (frm.doc.warranty_status) filters.push(`Warranty: ${frm.doc.warranty_status}`);
//     if (frm.doc.circle) filters.push(`Circle: ${frm.doc.circle}`);
//     if (frm.doc.rma_id) filters.push(`RMA ID: ${frm.doc.rma_id}`);  // Added RMA ID to filters
//     return filters;
// }

// // Child table events
// frappe.ui.form.on("Quality Check Technician View Table", {
//     refresh: function(frm) {
//         setup_field_filters(frm);
//     }
// });

// frappe.form.link_formatters['Employee'] = function(value, doc) {
//     if (doc.assigned_to === value && doc.assigned_to_name) {
//         return value + ' - ' + doc.assigned_to_name;
//     }
//     if (doc.quality_check_assigned_to === value && doc.quality_check_assigned_to_name) {
//         return value + ' - ' + doc.quality_check_assigned_to_name;
//     }
//     return value;
// };








frappe.ui.form.on('Quality Check Technician View', {
    refresh: function (frm) {
        // Set current technician on form load
        set_current_technician(frm);

        if(frm.doc.technician){
            load_technician_quality_check_data(frm);
        }
        
        // Remove existing Get Data button if present
        if (frm.custom_buttons["Get Data"]) {
            frm.remove_custom_button("Get Data");
        }

        // Add Get Data button
        frm.add_custom_button(__('Get Data'), function () {
            load_technician_quality_check_data(frm);
        }).addClass('btn-primary');

        // Setup field filters
        setup_field_filters(frm);
    },

    customer: function (frm) {
        // Clear lot_no when customer changes
        if (frm.doc.lot_no) {
            frm.set_value('lot_no', '');
        }
    },
    
    // Add RMA ID field event handler
    rma_id: function(frm) {
        console.log("RMA ID changed to:", frm.doc.rma_id);
    },
    
    // Add Repair Status field event handler (Link field)
    repair_status: function(frm) {
        console.log("Repair Status changed to:", frm.doc.repair_status);
    },

    technician: function (frm) {
        let employee_id = frm.doc.technician;
        
        if (employee_id && employee_id.includes(' - ')) {
            employee_id = employee_id.split(' - ')[0];
        }

        // Format technician field with employee name if not already formatted
        if (frm.doc.technician && !frm.doc.technician.includes(' - ')) {
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
    },

    before_save: async function (frm) {
        let oldData = JSON.parse(localStorage.getItem("quality_check_tech_view_snapshot") || "[]");

        for (let row of frm.doc.quality_check_technician_view_table) {
            let original = oldData.find(o => o.rma_id === row.rma_id);
            if (!original) continue;

            let hasSimpleChange = false;
            let updates = {};
            function normalize(val) {
                if (val === undefined || val === null) return "";
                return val;
            }

            let hasRepairStatusChanged = normalize(row.status) !== normalize(original.rma_id_status);
            let remarksChanged = normalize(row.repair_remarks) !== normalize(original.remarks[original.remarks.length - 1]?.repair_remarks);

            if (normalize(row.status) !== normalize(original.rma_id_status)) {
                updates.rma_id_status = row.status;
                hasSimpleChange = true
            }

            if(row.quality_check_done !== original.quality_check_done) {
                hasSimpleChange = true;
                updates.quality_check_done = row.quality_check_done;
            }

            if(normalize(row.quality_check_date) !== normalize(original.quality_check_done_date)) {
                hasSimpleChange = true;
                updates.quality_check_done_date = row.quality_check_date;
            }

            if(row.quality_check_pass !== original.quality_check_pass) {
                hasSimpleChange = true;
                updates.quality_check_pass = row.quality_check_pass;
            }

            console.log("Updates for RMA", row.rma_id, ":", updates);

            if(hasSimpleChange) {
                await frappe.db.set_value('RMA BIN', row.rma_id, updates);
            }

            if (hasRepairStatusChanged) {
                let rmaDoc = await frappe.db.get_doc("RMA BIN", row.rma_id);
                rmaDoc.rma_status.push({
                    repair_status: row.status,
                    timestamp: frappe.datetime.now_datetime()
                });
                rmaDoc.last_updated_on = frappe.datetime.now_datetime();
                await frappe.call({
                    method: "frappe.client.save",
                    args: { doc: rmaDoc }
                });
            }

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

            localStorage.setItem("quality_check_tech_view_snapshot", JSON.stringify(frm.doc.quality_check_technician_view_table));
        }
    },
    
    onload_post_render: function (frm) {
        localStorage.removeItem("quality_check_tech_view_snapshot");
        frm.set_value("customer", "")
        frm.set_value("lot_no", "")
        frm.set_value("repair_status", "")  // Clear repair status Link field
        frm.clear_table("quality_check_technician_view_table");
        frm.refresh_field("quality_check_technician_view_table")
    },
});

function set_current_technician(frm) {
    let current_user = frappe.session.user;

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Employee",
            filters: {
                'prefered_email': current_user
            },
            fields: ['name', 'employee', 'employee_name'],
            limit_page_length: 1
        },
        callback: function (r) {
            console.log("Employee data:", r.message);
            if (r.message && r.message.length > 0) {
                let employee_data = r.message[0];
                let employee_id = employee_data.name;
                let employee_name = employee_data.employee_name || '';
                
                // Set technician field with employee name format
                frm.set_value('technician', `${employee_id} - ${employee_name}`);
            }
        },
        error: function(err) {
            console.error("Error fetching current user employee:", err);
        }
    });
}

function setup_field_filters(frm) {
    // Set filter for lot_no based on customer
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
    
    // No need to set query for repair_status as it's a standard Link field to Repair Status DocType
    // Frappe will automatically provide the list from Repair Status DocType
}

function load_technician_quality_check_data(frm) {
    if (!frm.doc.technician) {
        frappe.show_alert({
            message: 'Technician field is required',
            indicator: 'red'
        });
        return;
    }

    frappe.show_alert({
        message: 'Loading Quality Check data...',
        indicator: 'blue'
    });

    // Updated to include repair_status parameter
    frappe.call({
        method: "rms.rms.doctype.quality_check_technician_view.quality_check_technician_view.get_technician_quality_check_data",
        args: {
            technician: frm.doc.technician,
            customer: frm.doc.customer || '',
            lot_no: frm.doc.lot_no || '',
            warranty_status: frm.doc.warranty_status || '',
            circle: frm.doc.circle || '',
            rma_id: frm.doc.rma_id || '',
            repair_status: frm.doc.repair_status || ''  // Pass repair status filter value
        },
        callback: function (r) {
            frm.clear_table('quality_check_technician_view_table')
            frm.clear_table("quality_check_technician_view_table");
            
            if (r.message && r.message.length > 0) {
                // Clear existing table data
                frm.clear_table("quality_check_technician_view_table");

                localStorage.setItem("quality_check_tech_view_snapshot", JSON.stringify(r.message));

                r.message.forEach(function (row) {
                    console.log("RMA BIN row:", row);
                    let child = frm.add_child("quality_check_technician_view_table");

                    // Map the basic fields
                    child.lot_no = row.lot_no;
                    child.rma_id = row.rma_id || row.name;  // Ensure RMA ID is populated
                    child.assigned_to = row.repaired_by?.split(" - ")[0];
                    
                    frappe.db.get_value('Employee', child.assigned_to, 'employee_name').then(r => {
                        if (r.message) {
                            child.assigned_to_name = r.message.employee_name;
                            frm.refresh_field("quality_check_technician_view_table");
                        }
                    });

                    child.quality_check_assigned_to = row.quality_check_assigned_to?.split(" - ")[0];
                    child.quality_check_assigned_to_name = row.quality_check_assigned_to?.split(" - ")[1];
                    child.customer = row.customer;
                    child.model_no = row.model_no;
                    child.part_no = row.part_no;
                    child.serial_no = row.serial_no;
                    child.assigned_date = row.assigned_date;
                    child.component_used = row.components_used
                    
                    // Conditionally set quality check fields only if they exist in RMA BIN
                    if (row.quality_check_assigned_date) {
                        child.quality_check_assigned_date = row.quality_check_assigned_date;
                    }

                    if (row.rma_assigned_date) {
                        child.assigned_date = row.rma_assigned_date;
                    }
                    
                    if (row.quality_check_done_date) {
                        child.quality_check_date = row.quality_check_done_date;
                    }

                    if(row.quality_check_done){
                        child.quality_check_done = row.quality_check_done
                    }
                    
                    child.component_used = row.component_used || '';
                    child.material_receipt = row.material_receipt || '';
                    child.repair_remarks = row.remarks[row.remarks.length - 1]?.repair_remarks || '';
                    child.fault_found = row.receiving_remarks || '';
                    child.status = row.rma_id_status;
                    child.quality_check_pass = row.quality_check_pass;
                    
                    if(row.receiving_date) {
                        child.receiving_date = row.receiving_date
                        let today_date = frappe.datetime.get_today();
                        let diff = frappe.datetime.get_diff(today_date, row.receiving_date)
                        child.tat = diff
                    }
                });

                frm.refresh_field("quality_check_technician_view_table");

                let filter_info = get_filter_info(frm);
                frappe.show_alert({
                    message: `Loaded ${r.message.length} RMA BIN records${filter_info}`,
                    indicator: 'green'
                });

            } else {
                frm.clear_table("quality_check_technician_view_table");
                frm.refresh_field("quality_check_technician_view_table");

                let filter_text = get_active_filters(frm);
                frappe.show_alert({
                    message: `No RMA BIN data found${filter_text}`,
                    indicator: 'orange'
                });
            }
        },
        error: function (r) {
            console.error("Error loading RMA BIN data:", r);
            frappe.show_alert({
                message: 'Error loading RMA BIN data',
                indicator: 'red'
            });
        }
    });
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
    if (frm.doc.rma_id) filters.push(`RMA ID: ${frm.doc.rma_id}`);  
    if (frm.doc.repair_status) filters.push(`Status: ${frm.doc.repair_status}`);  // Added Repair Status to filters
    return filters;
}

// Child table events
frappe.ui.form.on("Quality Check Technician View Table", {
    refresh: function(frm) {
        setup_field_filters(frm);
    }
});

frappe.form.link_formatters['Employee'] = function(value, doc) {
    if (doc.assigned_to === value && doc.assigned_to_name) {
        return value + ' - ' + doc.assigned_to_name;
    }
    if (doc.quality_check_assigned_to === value && doc.quality_check_assigned_to_name) {
        return value + ' - ' + doc.quality_check_assigned_to_name;
    }
    return value;
};