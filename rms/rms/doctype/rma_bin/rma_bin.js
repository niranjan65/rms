// frappe.ui.form.on("RMA BIN", {
//     refresh: function(frm) {
//         // Set up employee fields display after a short delay
//         setTimeout(() => {
//             frm.setup_employee_fields();
//         }, 100);
//     },

//     onload: function(frm) {
//         frm.setup_employee_fields = function() {
//             // Process both employee fields
//             frm.process_employee_field('repaired_by', 'repaired_by_name');
//             frm.process_employee_field('quality_check_assigned_to', 'quality_check_assigned_to_name');
//         };

//         frm.process_employee_field = function(field_name, name_field) {
//             if (!frm.doc[field_name]) return;
            
//             let employee_id = frm.doc[field_name];
//             // Clean the ID (remove any accidental name part)
//             if (employee_id.includes(' - ')) {
//                 employee_id = employee_id.split(' - ')[0];
//                 frm.set_value(field_name, employee_id);
//             }

//             // Fetch employee name if not present
//             if (!frm.doc[name_field]) {
//                 frappe.db.get_value('Employee', employee_id, 'employee_name')
//                     .then(r => {
//                         if (r.message && r.message.employee_name) {
//                             frm.set_value(name_field, r.message.employee_name);
//                             frm.set_display_value(field_name, employee_id, r.message.employee_name);
//                         }
//                     });
//             } else {
//                 // We have the name, set display immediately
//                 frm.set_display_value(field_name, employee_id, frm.doc[name_field]);
//             }
//         };

//         frm.set_display_value = function(field_name, employee_id, employee_name) {
//             let field = frm.fields_dict[field_name];
//             if (field && field.$input) {
//                 // Store original value
//                 let original_value = employee_id;
                
//                 // Override the get_value method temporarily
//                 let original_get_value = field.get_value;
//                 field.get_value = function() {
//                     return original_value;
//                 };

//                 // Set display value
//                 field.$input.val(`${employee_id} - ${employee_name}`);
                
//                 // Handle input events
//                 field.$input.off('input.employee_format change.employee_format');
//                 field.$input.on('input.employee_format change.employee_format', function() {
//                     let current_val = $(this).val();
//                     if (current_val && !current_val.includes(' - ')) {
//                         // User changed the value, restore original get_value
//                         field.get_value = original_get_value;
//                         original_value = current_val;
//                     }
//                 });
//             }
//         };
//     },

//     // Handle field changes
//     repaired_by: function(frm) {
//         // Clear the name field when employee changes
//         if (frm.doc.repaired_by) {
//             frm.fetch_and_display_employee('repaired_by', 'repaired_by_name');
//         } else {
//             frm.set_value('repaired_by_name', '');
//         }
//     },

//     quality_check_assigned_to: function(frm) {
//         // Clear the name field when employee changes
//         if (frm.doc.quality_check_assigned_to) {
//             frm.fetch_and_display_employee('quality_check_assigned_to', 'quality_check_assigned_to_name');
//         } else {
//             frm.set_value('quality_check_assigned_to_name', '');
//         }
//     },

//     // Handle before save to ensure we save only the ID
//     before_save: function(frm) {
//         // Clean up the employee fields before saving
//         ['repaired_by', 'quality_check_assigned_to'].forEach(field => {
//             if (frm.doc[field] && frm.doc[field].includes(' - ')) {
//                 let employee_id = frm.doc[field].split(' - ')[0];
//                 frm.set_value(field, employee_id);
//             }
//         });
//     }
// });





