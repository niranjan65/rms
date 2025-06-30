// Copyright (c) 2025, Anantdv and contributors
// For license information, please see license.txt

frappe.ui.form.on("Final Quality Check", {
  customer: function (frm) {
    frm.set_query("batch_no", () => {
      return {
        filters: {
          custom_customer: frm.doc.customer,
        },
      };
    });
  },

  batch_no: function (frm) {
    if (frm.doc.batch_no) {
      frm.clear_table("fqc_bulk");
      frm.clear_table("fqc_item");
      frm.refresh_field("fqc_bulk");
      frm.refresh_field("fqc_item");

      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Batch",
          name: frm.doc.batch_no,
        },
        callback: function (r) {
          console.log("Batch", r);
          frm.doc.isbulk = r.message.custom_is_bulk;
          let data = r.message;
          let filtered_fqc = data.custom_rma_no.filter((rma_item)=>{
            return rma_item.material_receipt_done === 1 && Number(rma_item.physical_screening_done)=== 1 && rma_item.rma_allocation_done == 1
          })
          frm.doc.item = data.item;
          frm.refresh_field("item")
          if (frm.doc.isbulk === 1) {
            frappe.call({
              method:
                "rms.rms.doctype.final_quality_check.fqc.get_rma_allocation",
              args: {
                batch_no: frm.doc.batch_no,
              },

              // frappe.call({
              //     method: "frappe.client.get",
              //     args: {
              //         doctype: "RMA Allocation",
              //         filters: [
              //             ['batch_no', '=', frm.doc.batch_no]
              //         ],
              //         fields: ['technician']

              callback: function (r) {
                if (r.message) {
                  console.log("helloofirst", r.message);
                  let data = r.message;
                  console.log("first", data);
                //   frm.doc.item = data.item;
                  refresh_field("item");

                  // if(data.isbulk == 0){
                  //     frm.set_df_property('isbulk', 'hidden', 1);
                  //     console.log("second", data);
                  //     frm.set_value("isbulk", 0);

                  //     data.rma_allocated_list.forEach(item => {
                  //         if(item.technician){
                  //             let row = frm.add_child('fqc_item');
                  //         console.log("Happy", row)
                  //         row.rma_item = item.rma_item,
                  //         row.techician = item.technician,
                  //         row.serial_number = item.serial_number
                  //         }
                  //         frm.refresh_field('fqc_item')
                  //     })
                  // }
                  if (data.isbulk == 1) {
                    console.log("third", data);
                    console.log("isbulk", data.isbulk);
                    frm.set_value("isbulk", 1);
                    data.bulk_rma_allocation.forEach((item) => {
                      let row = frm.add_child("fqc_bulk");
                      (row.technician = item.techician),
                        (row.allocated_quantity = item.quantity),
                        (row.quantity = item.quantity);
                      frm.refresh_field("fqc_bulk");
                    });
                  }
                }
              },
            });
          }
           else{
            console.log("Not a bulk item");

            if(filtered_fqc.length > 0){
                frm.clear_table("fqc_item");
                // filtered_fqc.forEach((item)=>{
                //     let row = frm.add_child("fqc_item");
                //     row.rma_item = item.rma_no;
                //     row.techician = item.technician;
                // })

                console.log("Filtered FQC", filtered_fqc);
                filtered_fqc.forEach((item) => {
                  
                    let row = frm.add_child("fqc_item");
                    console.log("Happy", row);
                    row.rma_item = item.rma_no;
                    row.techician = item.technician;
                    row.serial_number = item.serial_no;
                  
                    frm.refresh_field("fqc_item")
                });

            }
             
          }
         
          frm.refresh_field("isbulk");
          // frm.clear_table("fqc_bulk");
          // frm.clear_table("fqc_item");
        },
      });

      // frappe.db.get_doc("RMA Allocation", frm.doc.batch_no).then((r) => console.log("The value of r: ", r));

      // frappe.call({
      //     method: "rms.rms.doctype.final_quality_check.fqc.get_rma_allocation",
      //     args: {
      //         batch_no: frm.doc.batch_no
      //     },

      // // frappe.call({
      // //     method: "frappe.client.get",
      // //     args: {
      // //         doctype: "RMA Allocation",
      // //         filters: [
      // //             ['batch_no', '=', frm.doc.batch_no]
      // //         ],
      // //         fields: ['technician']

      //     callback: function (r) {
      //         if(r.message){
      //             console.log("helloofirst", r.message)
      //             let data = r.message;
      //             console.log("first",data);
      //             frm.doc.item = data.item
      //             refresh_field('item')

      //             if(data.isbulk == 0){
      //                 frm.set_df_property('isbulk', 'hidden', 1);
      //                 console.log("second", data);
      //                 frm.set_value("isbulk", 0);

      //                 data.rma_allocated_list.forEach(item => {
      //                     if(item.technician){
      //                         let row = frm.add_child('fqc_item');
      //                     console.log("Happy", row)
      //                     row.rma_item = item.rma_item,
      //                     row.techician = item.technician,
      //                     row.serial_number = item.serial_number
      //                     }
      //                     frm.refresh_field('fqc_item')
      //                 })
      //             }
      //             else if(data.isbulk == 1){
      //                 console.log("third", data);
      //                 console.log("isbulk", data.isbulk);
      //                 frm.set_value("isbulk", 1);
      //                  data.bulk_rma_allocation.forEach(item => {
      //                     let row = frm.add_child('fqc_bulk');
      //                     row.technician = item.techician,
      //                     row.allocated_quantity= item.quantity,
      //                     row.quantity = item.quantity
      //                     frm.refresh_field('fqc_bulk')
      //                 })
      //             }
      //         }
      //     }
      // });
    }
  },

   before_save: function (frm) {
    if (frm.doc.batch_no) {
      console.log("Batch No RMA ALlocation:", frm.doc.batch_no);
      if (frm.doc.isbulk) {
        frappe.call({
          method: "frappe.client.set_value",
          args: {
            doctype: "Batch",
            name: frm.doc.batch_no,
            fieldname: "custom_final_quality_check",
            value: 1,
          },
          callback: function (r) {
            if (!r.exc) {
              console.log("Batch updated successfully");
            }
          },
        });
      }
    }
  },
});
