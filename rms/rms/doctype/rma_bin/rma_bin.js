// // frappe.ui.form.on("RMA BIN", {
// //     refresh: function(frm) {
// //         // Set up employee fields display after a short delay
// //         setTimeout(() => {
// //             frm.setup_employee_fields();
// //         }, 100);
// //     },

// //     onload: function(frm) {
// //         frm.setup_employee_fields = function() {
// //             // Process both employee fields
// //             frm.process_employee_field('repaired_by', 'repaired_by_name');
// //             frm.process_employee_field('quality_check_assigned_to', 'quality_check_assigned_to_name');
// //         };

// //         frm.process_employee_field = function(field_name, name_field) {
// //             if (!frm.doc[field_name]) return;
            
// //             let employee_id = frm.doc[field_name];
// //             // Clean the ID (remove any accidental name part)
// //             if (employee_id.includes(' - ')) {
// //                 employee_id = employee_id.split(' - ')[0];
// //                 frm.set_value(field_name, employee_id);
// //             }

// //             // Fetch employee name if not present
// //             if (!frm.doc[name_field]) {
// //                 frappe.db.get_value('Employee', employee_id, 'employee_name')
// //                     .then(r => {
// //                         if (r.message && r.message.employee_name) {
// //                             frm.set_value(name_field, r.message.employee_name);
// //                             frm.set_display_value(field_name, employee_id, r.message.employee_name);
// //                         }
// //                     });
// //             } else {
// //                 // We have the name, set display immediately
// //                 frm.set_display_value(field_name, employee_id, frm.doc[name_field]);
// //             }
// //         };

// //         frm.set_display_value = function(field_name, employee_id, employee_name) {
// //             let field = frm.fields_dict[field_name];
// //             if (field && field.$input) {
// //                 // Store original value
// //                 let original_value = employee_id;
                
// //                 // Override the get_value method temporarily
// //                 let original_get_value = field.get_value;
// //                 field.get_value = function() {
// //                     return original_value;
// //                 };

// //                 // Set display value
// //                 field.$input.val(`${employee_id} - ${employee_name}`);
                
// //                 // Handle input events
// //                 field.$input.off('input.employee_format change.employee_format');
// //                 field.$input.on('input.employee_format change.employee_format', function() {
// //                     let current_val = $(this).val();
// //                     if (current_val && !current_val.includes(' - ')) {
// //                         // User changed the value, restore original get_value
// //                         field.get_value = original_get_value;
// //                         original_value = current_val;
// //                     }
// //                 });
// //             }
// //         };
// //     },

// //     // Handle field changes
// //     repaired_by: function(frm) {
// //         // Clear the name field when employee changes
// //         if (frm.doc.repaired_by) {
// //             frm.fetch_and_display_employee('repaired_by', 'repaired_by_name');
// //         } else {
// //             frm.set_value('repaired_by_name', '');
// //         }
// //     },

// //     quality_check_assigned_to: function(frm) {
// //         // Clear the name field when employee changes
// //         if (frm.doc.quality_check_assigned_to) {
// //             frm.fetch_and_display_employee('quality_check_assigned_to', 'quality_check_assigned_to_name');
// //         } else {
// //             frm.set_value('quality_check_assigned_to_name', '');
// //         }
// //     },

// //     // Handle before save to ensure we save only the ID
// //     before_save: function(frm) {
// //         // Clean up the employee fields before saving
// //         ['repaired_by', 'quality_check_assigned_to'].forEach(field => {
// //             if (frm.doc[field] && frm.doc[field].includes(' - ')) {
// //                 let employee_id = frm.doc[field].split(' - ')[0];
// //                 frm.set_value(field, employee_id);
// //             }
// //         });
// //     }
// // });


// /////////////////////////////////////////////////////////1

// frappe.ui.form.on("RMA BIN", {
//     refresh: function(frm) {
//         // Set up employee fields display after a short delay
//         // setTimeout(() => {
//         //     frm.setup_employee_fields();
//         // }, 100);
//         // frm.doc.
//         frappe.call({
//             method: "rms.rms.doctype.rma_bin.rma_bin.count_Total_TAT",
//             args: {
//                 rma_id: frm.doc.rma_id
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     // let total_tat = 0;
//                     // for (let key in r.message[1]) {
//                     //     total_tat += r.message[1][key];
//                     // }
//                     frm.set_value('total_tat', r.message);
//                     // frm.refresh_field('total_tat');
//                 }
//             },
//             error: function(err) {  
//                 frm.msgprint("Error calculating Total TAT");
//                 frm.set_value('total_tat', "0:00:00");
//             }
//         });
//     },

//     // rma_id: function(frm) {
//     //     frm.set_value('total_tat', 0);
//     // },
// });



// //////////////////////////////////2/////////////////


// frappe.ui.form.on("RMA BIN", {
//     // refresh: function(frm) {
//     //     // Set up employee fields display after a short delay
//     //     // setTimeout(() => {
//     //     //     frm.setup_employee_fields();
//     //     // }, 100);
//     //     // frm.doc.
//     //     frappe.call({
//     //         method: "rms.rms.doctype.rma_bin.rma_bin.count_Total_TAT",
//     //         args: {
//     //             rma_id: frm.doc.rma_id
//     //         },
//     //         callback: function(r) {
//     //             if (r.message) {
//     //                 // let total_tat = 0;
//     //                 // for (let key in r.message[1]) {
//     //                 //     total_tat += r.message[1][key];
//     //                 // }
//     //                 frm.set_value('total_tat', r.message);
//     //                 // frm.refresh_field('total_tat');
//     //             }
//     //         },
//     //         error: function(err) {  
//     //             frm.msgprint("Error calculating Total TAT");
//     //             frm.set_value('total_tat', "0:00:00");
//     //         }
//     //     });
//     // },

//     // rma_id: function(frm) {
//     //     frm.set_value('total_tat', 0);
//     // },

//     // New logic for total_repair_time calculation
//     // repair_and_return_end_time: function(frm) {
//     //     calculate_repair_time(frm);
//     //     frm.save();
//     // },
//     // refresh: function(frm) {
//     //     calculate_repair_time(frm);
//     // },

//     // // New logic for total_quality_time calculation
//     quality_check_end_time: function(frm) {
//         calculate_quality_time(frm);
//         frm.save();
//     },
//     // refresh: function(frm) {
//     //     calculate_repair_time(frm);
//     //     calculate_quality_time(frm);
//     //     frm.save();
//     // }
// });

// // Function to calculate repair time difference
// // function calculate_repair_time(frm) {
// //     console.log("Calculating repair time...");      
// //     if (frm.doc.repair_and_return_start_time && frm.doc.repair_and_return_end_time) {
// //         let start = moment(frm.doc.repair_and_return_start_time);
// //         let end = moment(frm.doc.repair_and_return_end_time);
// //         let duration = moment.duration(end.diff(start));
// //         let hours = Math.floor(duration.asHours());
// //         let minutes = duration.minutes();
// //         let seconds = duration.seconds();
// //         let formatted_time = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
// //         frm.set_value('total_repair_time', formatted_time);
// //         frm.refresh_field('total_repair_time');
// //     } else {
// //         frm.set_value('total_repair_time', "0:00:00");
// //         frm.refresh_field('total_repair_time');
// //     }
// // }

// // Function to calculate quality check time difference
// function calculate_quality_time(start_time,end_time,set_feild_name) {
//     if (start_time && end_time) {
//         let start = moment(start_time);
//         let end = moment(end_time);
//         let duration = moment.duration(end.diff(start));
//         let hours = Math.floor(duration.asHours());
//         let minutes = duration.minutes();
//         let seconds = duration.seconds();
//         let formatted_time = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
//         frm.set_value(set_feild_name, formatted_time);
//         frm.refresh_field(set_feild_name);
//     } else {
//         frm.set_value(set_feild_name, "0:00:00");
//         frm.refresh_field(set_feild_name);
//     }
// }
