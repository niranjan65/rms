// // Copyright (c) 2025, Anantdv and contributors
// // For license information, please see license.txt

frappe.ui.form.on('RMA Allocation', {
    validate: function(frm) {
        
        let allRows = [...frm.doc.rma_allocated_list]; 
        let unassignedRows = allRows.filter(row => !row.technician);
        console.log(unassignedRows)

        frm.add_custom_button('Toggle Unassigned Rows', function() {
            let showUnassigned = frm.show_unassigned || false;

            frm.clear_table('rma_allocated_list');
            let rowsToShow = showUnassigned ? allRows : unassignedRows;

            rowsToShow.forEach(row => frm.add_child('rma_allocated_list', row));
            
            frm.show_unassigned = !showUnassigned;
            frm.refresh_field('rma_allocated_list');
        });
    },

    isbulk: function(frm) {
        if (frm.doc.isbulk) {
            frm.set_df_property('rma_allocated_list', 'hidden', 1);
        } 
        else {
            frm.set_df_property('rma_allocated_list', 'hidden', 0);
        }
    },
    customer:function(frm){
        frm.set_query("batch_no", ()=>{
            return{
                filters:{
                    "customer":frm.doc.customer,
                    "physical_screening_check":1,
                    "rma_allocation_check":0
                }
            }
        })
    },
    before_save: function(frm) {
        if (frm.doc.batch_no ) {
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Batch No',
                    name: frm.doc.batch_no,
                    fieldname: 'rma_allocation_check',
                    value: 1
                },
                callback: function(r) {
                    if (!r.exc) {
                        console.log('Batch updated successfully');
                    }
                }
            });
        }
    }

});


frappe.ui.form.on('Bulk RMA Allocation List', {
    quantity: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.quantity > frm.doc.unallocated_quantity) {
            frappe.msgprint(__('Quantity cannot be greater than available quantity'));
            
        } else if (row.quantity < 0) {
            frappe.msgprint(__('Quantity cannot be negative'));
        } else {
            console.log("Row quantity updated:", row.quantity);
           
            
            frm.doc.unallocated_quantity -= row.quantity;
            frm.doc.allocated_quantity += row.quantity;

            frm.refresh_field('unallocated_quantity');
            frm.refresh_field('allocated_quantity');

            console.log("Unallocated quantity before update:", frm.doc.unallocated_quantity);
            console.log("Allocated quantity before update:", frm.doc.allocated_quantity);
        }
        frm.refresh_field('unallocated_quantity');
        frm.refresh_field('rma_allocated_list');
    },
});
