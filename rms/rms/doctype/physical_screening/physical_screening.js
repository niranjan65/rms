frappe.ui.form.on("Physical Screening", {
    refresh: function(frm) {
        if((!frm.is_new() && frm.doc.screening_items && frm.doc.screening_items.length > 0)||(!frm.is_new() && frm.doc.bulk_items && frm.doc.bulk_items.length > 0) ){
            frm.add_custom_button(__('Go to Allocation List'), function(){
                generateRMAAllocation(frm);
            })
        }
    },

    batch_no: function(frm) {
        
        frm.clear_table('screening_items');
        frm.clear_table('bulk_items');
        frm.set_value('is_bulk', 0);
        frm.refresh_fields(['bulk_items', 'screening_items']);
    },

    // fetch_rma_list: function(frm) {
    //     if(!frm.doc.batch_no) {
    //         frappe.throw("Please select a batch number first");
    //         return;
    //     }
    //     fetchBatchData(frm);
    // },

    is_bulk: function(frm) {
        frm.clear_table('bulk_items');
        // frm.clear_table('screening_items');
        frm.refresh_fields(['bulk_items', 'screening_items']);
        
        if(frm.doc.batch_no) {
            fetchBatchData(frm);
        }
    },

    fetch_rma_list: function(frm) {
        if(!frm.doc.batch_no) {
            frappe.throw("Please select a batch number first");
            return;
        }
        fetchScreeningItems(frm);
    },

    customer: function(frm) {

        frm.clear_table('screening_items');
        frm.clear_table('bulk_items');
        frm.set_value('is_bulk', 0);
        frm.refresh_fields(['bulk_items', 'screening_items']);

        frm.set_value('batch_no', '');
        frm.set_query("batch_no", () => {
            return {
                filters: {
                    "customer": frm.doc.customer,
                    "physical_screening_check": 0
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
                    fieldname: 'physical_screening_check',
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

function generateRMAAllocation(frm) {
    let ps_children = [];
    let accepted_qty = 0;
    if(frm.doc.bulk_items && frm.doc.bulk_items.length > 0) {
       accepted_qty = frm.doc?.bulk_items[0]?.accepted_quantity;
    }
    
    frm.doc.screening_items.forEach(item => {
        if(item.status === 'Ok'){
            ps_children.push(item);
        }
    });



    let allocation_list = frappe.model.get_new_doc('RMA Allocation');
    allocation_list.rma_allocated_list = [];

    allocation_list.customer = frm.doc.customer;
    allocation_list.batch_no = frm.doc.batch_no;

   if(frm.doc.screening_items && frm.doc.screening_items.length > 0) {
    ps_children.forEach(item => {
        allocation_list.rma_allocated_list.push({
            doctype: 'RMA Assignment',
            rma_item: item.item
        })
    });
   }

   if(frm.doc.bulk_items && frm.doc.bulk_items.length > 0) {
      allocation_list.isbulk=1;
      allocation_list.total_acquired_quantity = accepted_qty;
      allocation_list.unallocated_quantity = accepted_qty;
    }

    console.log("Allocation List Data", allocation_list);

    frappe.db.insert(allocation_list)
        .then(() => {
            frappe.set_route('Form', 'RMA Allocation', allocation_list.name);
        })
        .catch(err => {
            console.error(`Error creating RMA Allocation`, err);
            frappe.throw(`Error creating RMA Allocation: ${err}`);
        });
}

function fetchBatchData(frm) {
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Batch No',
            name: frm.doc.batch_no
        },
        callback: function(r) {
            if (!r.message) {
                frappe.show_alert({
                    message: __('No data found for this batch'),
                    indicator: 'red'
                });
                return;
            }

            if (frm.doc.is_bulk) {
                // Handle bulk items
                frm.clear_table('bulk_items');
                
                // Check if RMA No child table exists and has items
                if (r.message.rma_no && r.message.rma_no.length > 0) {
                    let row = frm.add_child('bulk_items');
                    row.bulk_name = frm.doc.batch_no;
                    
                    // Set quantity equal to number of RMA items
                    row.quantity = r.message.rma_no.length;
                    
                    frm.refresh_field('bulk_items');
                    
                    frappe.show_alert({
                        message: __('Bulk quantity fetched successfully'),
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: __('No quantity data found for bulk processing'),
                        indicator: 'red'
                    });
                }
            }
        }
    });
}

function fetchScreeningItems(frm) {
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Batch No',
            name: frm.doc.batch_no
        },
        callback: function(r) {
            if (!r.message) {
                frappe.show_alert({
                    message: __('No data found for this batch'),
                    indicator: 'red'
                });
                return;
            }

            if (r.message.rma_no && r.message.rma_no.length > 0) {
                frm.clear_table('screening_items');
                
                r.message.rma_no.forEach(rma_item => {
                    let row = frm.add_child('screening_items');
                    row.item = rma_item.rma_no;
                    // row.status = 'Pending';
                });
                
                frm.refresh_field('screening_items');
                
                frappe.show_alert({
                    message: __('RMA List fetched successfully'),
                    indicator: 'green'
                });
            } else {
                frappe.show_alert({
                    message: __('No RMA items found for this batch'),
                    indicator: 'red'
                });
            }
        }
    });
}


