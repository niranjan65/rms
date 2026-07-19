# new code pk    >>>>>>>>>>>>>

# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _
import io
import barcode
from barcode.writer import ImageWriter
from datetime import datetime
from frappe.utils import getdate, nowdate
from PIL import Image, ImageDraw, ImageFont

class RMA(Document):
    def validate(self):
        # Any validation logic can go here
        pass
    def before_submit(self):
        seen = set()

        for row in self.rma_features:
            if not row.rma_id:
                continue
            row.barcode = row.rma_id
            if row.barcode in seen:
                frappe.throw(
                    f"Duplicate Barcode in this RMA: {row.barcode}"
                )

        seen.add(row.barcode)

    def before_save(self):
        serial_map = {}
        for row in self.rma_features:
            if not row.serial_no:
                continue

            if row.serial_no in serial_map:
                first_row = serial_map[row.serial_no]
                second_row = row.idx

                frappe.throw(
                    f"Duplicate Serial No <b>{row.serial_no}</b> found in rows "
                    f"<b>{first_row}</b> and <b>{second_row}</b>.",
                    title="Duplicate Serial Number"
                )
            else:
                serial_map[row.serial_no] = row.idx

    def on_submit(self):
        # Set the date to current date/time when document is submitted
        self.db_set('date', frappe.utils.today())
        
        if not self.material_receipt_created:
            self.create_material_receipt()
   
    def create_material_receipt(self):
        """Create Material Receipt when RMA is approved"""
        try:
            # Validate required fields - THROW ERRORS if missing
            if not self.rma_features:
                frappe.throw(_("No items found in RMA Features to create Material Receipt"))
            
            if not self.warehouse:
                frappe.throw(_("Warehouse is required to create Material Receipt"))
            
            if not self.customer:
                frappe.throw(_("Customer is required to create Material Receipt"))
            
            # Create new Stock Entry document
            stock_entry = frappe.new_doc("Stock Entry")
            stock_entry.stock_entry_type = "Material Receipt"
            stock_entry.company = "Ductus Technologies Pvt. Ltd."
            stock_entry.custom_customer = self.customer
            stock_entry.posting_date = frappe.utils.today()
            stock_entry.posting_time = frappe.utils.nowtime()
            stock_entry.custom_rma_reference = self.name
            stock_entry.connection = self.name
            stock_entry.remarks = f"Material Receipt created from RMA: {self.name}"
            
            # Add items from RMA Features
            valid_items = 0
            for feature in self.rma_features:
                if feature.model:  # Using Model field as requested
                    try:
                        # Get item details - this will throw error if item doesn't exist
                        item_details = frappe.get_doc("Item", feature.model)
                        
                        # Create stock entry detail
                        stock_entry.append("items", {
                            "item_code": feature.model,
                            "item_name": item_details.item_name,
                            "description": item_details.description,
                            "uom": "Pack",  
                            "stock_uom": item_details.stock_uom,
                            "qty": 1,  
                            "basic_rate": 0,  
                            "basic_amount": 0,
                            "t_warehouse": self.warehouse,  # Target warehouse from RMA
                            # "serial_no": feature.serial_no if feature.serial_no else "",
                            "conversion_factor": 1,
                            "allow_zero_valuation_rate": 1,  # This is the key fix
                        })
                        valid_items += 1
                        
                    except frappe.DoesNotExistError:
                        frappe.throw(_("Item {0} does not exist in the system").format(feature.model))
                else:
                    frappe.throw(_("Model field is empty in RMA Features row {0}").format(feature.idx))
            
            # Validate that we have items to add
            if valid_items == 0:
                frappe.throw(_("No valid items found from Model field in RMA Features"))
            
            # Validate warehouse exists
            if not frappe.db.exists("Warehouse", self.warehouse):
                frappe.throw(_("Warehouse {0} does not exist").format(self.warehouse))
            
            # Insert the stock entry first
            stock_entry.insert()
            
            # Try to submit, but handle valuation rate errors gracefully
            try:
                stock_entry.submit()
                status_msg = "created and submitted"
            except Exception as submit_error:
                # If submit fails due to valuation rate, that's okay - leave it in draft
                if "Valuation Rate" in str(submit_error):
                    status_msg = "created in draft status (please set valuation rates and submit manually)"
                else:
                    # For other submission errors, throw them
                    frappe.throw(_("Failed to submit Material Receipt: {0}").format(str(submit_error)))
            
            # Update RMA to mark material receipt as created
            self.db_set("material_receipt_created", stock_entry.name)

            # Create RMA BIN documents for each row in RMA Features
            self.create_rma_bin_documents()
            
            return stock_entry.name
            
        except Exception as e:
            # Log the detailed error
            frappe.log_error(f"Material Receipt creation failed for RMA {self.name}", str(e))
            
            # Re-throw the error to stop the workflow
            frappe.throw(_("Failed to create Material Receipt: {0}").format(str(e)))

    def create_rma_bin_documents(self):
        """Create RMA BIN documents for each row in RMA Features"""
        try:
            # Check if RMA BIN doctype exists
            if not frappe.db.exists("DocType", "RMA BIN"):
                frappe.msgprint("RMA BIN doctype not found. Please create the doctype first.", indicator="red")
                return
            
            rma_bin_count = 0
            failed_count = 0
            
            # Loop through each row in RMA Features child table
            for feature in self.rma_features:
                try:
                    # Check if this feature has rma_id (required for naming)
                    rma_id = getattr(feature, 'rma_id', '')
                    if not rma_id:
                        failed_count += 1
                        continue
                    
                    # Check if RMA BIN with this rma_id already exists
                    if frappe.db.exists("RMA BIN", rma_id):
                        failed_count += 1
                        continue
                    
                    # Create new RMA BIN document
                    rma_bin = frappe.new_doc("RMA BIN")
                    
                    # Set fields safely - avoid any object assignment issues
                    rma_bin.rma_creation_time = frappe.utils.now_datetime()
                    if rma_id:
                        rma_bin.rma_id = str(rma_id)
                        rma_bin.append("rma_tracking_status", {
                            "status": "RMA Generated",
                            "modified_by1": self.modified_by,
                            "timestamp":self.modified,
                            "remarks": "RMA BIN Created",
                            "rma_status": "RMA Created"
                            }
                            )

                    if self.customer:
                        rma_bin.customer = str(self.customer)
                    
                    rma_bin.lot_no = self.name
                    
                    # Set other fields from RMA Features safely
                    make_val = getattr(feature, 'brand', '')
                    if make_val:
                        rma_bin.make = str(make_val)
                    
                    model_val = getattr(feature, 'model', '')
                    if model_val:
                        rma_bin.model_no = str(model_val)
                    
                    part_no_val = getattr(feature, 'part_no', '')
                    if part_no_val:
                        rma_bin.part_no = str(part_no_val)
                    
                    serial_no_val = getattr(feature, 'serial_no', '')
                    if serial_no_val:
                        rma_bin.serial_no = str(serial_no_val)
                    
                    warranty_val = getattr(feature, 'warranty_status', '')
                    if warranty_val:
                        rma_bin.warranty_status = str(warranty_val)
                    
                    remarks_val = getattr(feature, 'receiving_remarks', '')
                    if remarks_val:
                        rma_bin.receiving_remarks = str(remarks_val)
                    
                    repair_val = getattr(feature, 'repair_status', '')
                    if repair_val:
                        rma_bin.repair_status = str(repair_val)
                    
                    # Set receiving_date to the submission date (today when submitted)
                    rma_bin.receiving_date = frappe.utils.today()
                    
                    # Set reference fields safely
                    material_receipt_ref = getattr(self, 'material_receipt_created', '')
                    if material_receipt_ref:
                        rma_bin.material_receipt = str(material_receipt_ref)
                    
                    customer_addr = getattr(self, 'customer_address', '')
                    if customer_addr:
                        rma_bin.customer_address = str(customer_addr)
                    
                    challan_no = getattr(self, 'delivery_challan_no', '')
                    if challan_no:
                        rma_bin.delivery_challan_no = str(challan_no)

                    lr_no = getattr(self, 'lr_no', '')
                    if lr_no:
                        rma_bin.lr_no = str(lr_no)

                    circle_location = getattr(self, 'location', '')
                    if circle_location:
                        rma_bin.circle = str(circle_location)

                    warehouse = getattr(self, 'warehouse', '')
                    if warehouse:
                        rma_bin.warehouse = str(warehouse)

                    # if feature.repair_status:
                    #     rma_bin.rma_id_status = feature.repair_status

                    # if feature.repair_status:
                    #     rma_bin.append('rma_status', {
                    #         'repair_status': feature.repair_status,
                    #         'timestamp': frappe.utils.now_datetime()
                    #     })

                    rma_bin.rma_id_status = "Rma Generated"

                    # Log "Rma Generated" as the initial status history entry
                    rma_bin.append('rma_status', {
                        'repair_status': "Rma Generated",
                        'timestamp': frappe.utils.now_datetime()
                    })

                    if feature.remarks:
                        rma_bin.append('remarks', {
                            'repair_remarks': feature.remarks,
                            'timestamp': frappe.utils.now_datetime()
                        })
                    
                    # Insert the document
                    rma_bin.insert(ignore_permissions=True)
                    rma_bin_count += 1
                    
                except Exception as row_error:
                    failed_count += 1
                    error_type = type(row_error).__name__
                    error_message = str(row_error)
                    continue  # Skip this row and continue with others
                
        except Exception as e:
            frappe.msgprint(
                "Failed to create RMA BIN documents. Check console for details.",
                title="RMA BIN Creation Error",
                indicator="orange"
            )




@frappe.whitelist()
def download_barcode(barcode_value):
    module_width = 0.3
    module_height = 20
    quiet_zone = 6

    writer_options = {
        "module_width": module_width,
        "module_height": module_height,
        "quiet_zone": quiet_zone,
        "write_text": False
    }

    code = barcode.get("code128", barcode_value, writer=ImageWriter())
    buffer = io.BytesIO()
    code.write(buffer, options=writer_options)
    buffer.seek(0)

    barcode_img = Image.open(buffer).convert("RGB")

    dpi = 300
    width_mm = 70
    height_mm = 35

    width_px = int(width_mm * dpi / 25.4)
    height_px = int(height_mm * dpi / 25.4)

    text_height = 28
    text_gap = 6

    barcode_img = barcode_img.resize(
        (width_px, height_px - text_height - text_gap),
        Image.Resampling.LANCZOS
    )
    final_img = Image.new("RGB", (width_px, height_px), "white")
    final_img.paste(barcode_img, (0, text_height + text_gap))

    draw = ImageDraw.Draw(final_img)

    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
    except:
        font = ImageFont.load_default()

    px_per_mm = dpi / 25.4
    bar_start_x = int(quiet_zone * px_per_mm)
    bar_end_x = width_px - bar_start_x

    left_padding = 35
    draw.text(
        (bar_start_x + left_padding, 4),
        barcode_value,
        fill="black",
        font=font
    )

    current_date = datetime.now().strftime("%d-%m-%Y")

    date_bbox = draw.textbbox((0, 0), current_date, font=font)
    date_width = date_bbox[2] - date_bbox[0]

    right_padding = 40

    draw.text(
        (bar_end_x - date_width - right_padding, 4),
        current_date,
        fill="black",
        font=font
    )
    final_buffer = io.BytesIO()
    final_img.save(final_buffer, format="PNG", dpi=(dpi, dpi))
    final_buffer.seek(0)

    frappe.local.response.filename = f"{barcode_value}.png"
    frappe.local.response.filecontent = final_buffer.getvalue()
    frappe.local.response.type = "download"
    
    
    
    

@frappe.whitelist()
def generate_rma_barcodes(rma_ids):
    import io, json, os
    from barcode import get
    from barcode.writer import ImageWriter
    from PIL import Image, ImageDraw, ImageFont
    from datetime import datetime
    import frappe

    rma_ids = json.loads(rma_ids)

    dpi = 300
    width_mm = 70
    height_mm = 35

    width_px = int(width_mm * dpi / 25.4)
    height_px = int(height_mm * dpi / 25.4)

    today = datetime.now().strftime("%d-%m-%Y")

    urls = []

    base_path = frappe.get_site_path("public", "files")

    for rma_id in rma_ids:
        code = get("code128", rma_id, writer=ImageWriter())
        buf = io.BytesIO()
        code.write(buf, {
            "module_width": 0.3,
            "module_height": 20,
            "quiet_zone": 6,
            "write_text": False
        })
        buf.seek(0)

        barcode_img = Image.open(buf).convert("RGB")

        text_height = int(height_px * 0.25)
        barcode_height = height_px - text_height

        barcode_img = barcode_img.resize(
            (width_px, barcode_height),
            Image.Resampling.LANCZOS
        )

        final_img = Image.new("RGB", (width_px, height_px), "white")
        final_img.paste(barcode_img, (0, text_height))

        draw = ImageDraw.Draw(final_img)

        try:
            font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
        except:
            font = ImageFont.load_default()

           

        left = int(width_px * 0.06)
        right = int(width_px * 0.06)

        



        draw.text((left, 5), rma_id, fill="black", font=font)

        date_width = draw.textbbox((0, 0), today, font=font)[2]
        draw.text((width_px - date_width - right, 5), today, fill="black", font=font)
       

        filename = f"RMA_{rma_id}.png"
        filepath = os.path.join(base_path, filename)

        final_img.save(filepath, format="PNG", dpi=(dpi, dpi))

        urls.append(f"/files/{filename}")


    return urls

    

def get_permission_query_conditions(user):
    if not user:
        user = frappe.session.user

    frappe.logger().info(f"RMA permission check for user: {user}")

    if user == "Administrator":
        return ""

    return f"`tabRMA`.`owner` = '{user}'"



# for warrenty check of old rma


@frappe.whitelist()
def get_old_rma_details(customer, old_rma):

    if not customer:
        frappe.throw("Please select Customer.")

    if not old_rma:
        frappe.throw("Please select Old RMA.")

    rma = frappe.db.get_value(
        "RMA BIN",
        {
            "customer": customer,
            "rma_id": old_rma,
            "rma_id_status": "Delivered"
        },
        [
            "make",
            "model_no",
            "part_no",
            "delivery_date"
        ],
        as_dict=True
    )

    if not rma:
        frappe.throw("Old RMA not found or not Delivered.")

    if not rma.delivery_date:
        frappe.throw("Delivery Date is missing in selected Old RMA.")

    # Fixed Warranty
    WARRANTY_DAYS = 90

    delivery_date = getdate(rma.delivery_date)
    today = getdate(nowdate())

    days_used = (today - delivery_date).days

    days_left = WARRANTY_DAYS - days_used

    if days_left >= 0:

        return {
            "make": rma.make,
            "model": rma.model_no,
            "part_no": rma.part_no,
            "warranty_status": "Yes",
            "message":
                f"""
                <div style="font-size:14px">

                <h4 style="color:green">
                ✅ Product is Under Warranty
                </h4>

                <hr>

                <b>Delivery Date :</b> {delivery_date}<br>

                <b>Warranty :</b> {WARRANTY_DAYS} Days<br>

                <b>Days Used :</b> {days_used} Days<br>

                <b style="color:green">
                Days Remaining : {days_left} Days
                </b>

                </div>
                """
        }

    else:

        return {
            "make": rma.make,
            "model": rma.model_no,
            "part_no": rma.part_no,
            "warranty_status": "No",
            "message":
                f"""
                <div style="font-size:14px">

                <h4 style="color:red">
                ❌ Warranty Expired
                </h4>

                <hr>

                <b>Delivery Date :</b> {delivery_date}<br>

                <b>Warranty :</b> {WARRANTY_DAYS} Days<br>

                <b>Days Used :</b> {days_used} Days<br>

                <b style="color:red">
                Warranty Expired {abs(days_left)} Days Ago
                </b>

                </div>
                """
        }