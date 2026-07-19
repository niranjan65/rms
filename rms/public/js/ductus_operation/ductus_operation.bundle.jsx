// import * as React from "react";
// import App from "./ductus/src/App.jsx"; 
// import "./ductus/src/index.css";        
// import { createRoot } from "react-dom/client";


// class Ductus_Operation {
// 	constructor({ page, wrapper }) {
// 		this.$wrapper = $(wrapper);
// 		this.page = page;

// 		this.init();
// 	}

// 	init() {
// 		this.setup_page_actions();
// 		this.setup_app();
// 	}

// 	setup_page_actions() {
// 		// setup page actions
// 		this.primary_btn = this.page.set_primary_action(__("Print Message"), () =>
// 	  		frappe.msgprint("Hello My Page!")
// 		);
// 	}

// 	setup_app() {
// 		// create and mount the react app
// 		const root = createRoot(this.$wrapper.get(0));
// 		root.render(<App />);
// 		this.$ductus_operation = root;
// 	}
// }

// frappe.provide("frappe.ui");
// frappe.ui.Ductus_Operation = Ductus_Operation;
// export default Ductus_Operation;









// Force the bundler to resolve to the exact same nested React package
import React from "./ductus/node_modules/react";
import { createRoot } from "./ductus/node_modules/react-dom/client";
import App from "./ductus/src/App.jsx"; 
import "./ductus/src/index.css";         

class Ductus_Operation {
	constructor({ page, wrapper }) {
		this.$wrapper = $(wrapper);
		this.page = page;

		this.init();
	}

	init() {
		this.setup_page_actions();
		this.setup_app();
	}

	setup_page_actions() {
		this.primary_btn = this.page.set_primary_action(__("Print Message"), () =>
			frappe.msgprint("Hello My Page!")
		);
	}

	setup_app() {
		this.$wrapper.empty();

		// Create dedicated container for our React App
		const react_container = document.createElement("div");
		react_container.id = "ductus-react-root";
		react_container.style.width = "100%";
		this.$wrapper.append(react_container);

		// Initialize and render React
		const root = createRoot(react_container);
		root.render(React.createElement(App));
		this.$ductus_operation = root;
	}
}

frappe.provide("frappe.ui");
frappe.ui.Ductus_Operation = Ductus_Operation;
export default Ductus_Operation;