frappe.pages["ductus_operation"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Ductus_Operation"),
		single_column: true,
	});
};

frappe.pages["ductus_operation"].on_page_show = function (wrapper) {
	load_desk_page(wrapper);
};

function load_desk_page(wrapper) {
	let $parent = $(wrapper).find(".layout-main-section");
	$parent.empty();

	frappe.require("ductus_operation.bundle.jsx").then(() => {
		frappe.ductus_operation = new frappe.ui.Ductus_Operation({
			wrapper: $parent,
			page: wrapper.page,
		});
	});
}