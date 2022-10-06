class TabularData extends HTMLElement{
 constructor(){
     super();

     // Reference to the root element
     this.root = null;
     // Reference to the handlebars template to render rows of the table
     this.tableRowTemplate = null;
     // Classes
     this.cssClasses = {
       DOWNLOAD: 'download',
       HIDDEN: 'hidden',
       SELECT_ALL_CHECKBOX: 'select-all',
       TABLE_ROW: 'table-row',
       TABLE_ROW_CHECKBOX: 'table-row-checkbox',
       TABLE_ROW_SELECTED: 'table-row-selected',
     }
     // Input json for the table.
     this.tableData = JSON.parse(this.getAttribute('data'));
     
     this.setupTemplates();
     this.setupRoot();
     this.attachShadow({ mode: 'open'});
     this.render();
 } 

 setupRoot() {
    this.root = document.createElement('template');
    this.root.innerHTML = `
    <style>
      .actions {
        display: flex;
        align-items: center;
      }
      .table-row {
        cursor: pointer;
      }
      .table-row:hover {
        background-color: lightgray;
      }
      .table-row-selected {
        background-color: gray;
      }
      .table-cell {
        margin-right: 16px;
      }
      .status {
        text-transform: capitalize;
      }
      .selection-count {
        flex-basis: 100px;
        padding-left: 16px;
      }
      .selection-count .hidden {
        display: none;
      }
      .download {
        border: 0;
        background: none;
        margin-left: 24px;
      }
    </style>
    <div>
      <div class="actions">
        <input type="checkbox" class="select-all" aria-label="Select All">
        <div class="selection-count">
          <p class="none">None selected </p>
          <p class="some"></p>
        </div>
        <button class="download">Download selected</button>
      </div>
      <table class="table-content">
        <tr>
          <th></th>
          <th>Name</th>
          <th>Device</th>
          <th>Path</th>
          <th>Status</th>
        </tr>
      </table>
    </div>`;
 }

 setupTemplates() {
  const tableRowMarkup = `
    {{#each list}}
      <tr class="table-row">
        <td>
          <input type="checkbox" class="table-row-checkbox" aria-label="select file"/>
        </td>
        <td class="table-cell">{{this.name}}</td>
        <td class="table-cell">{{this.device}}</td>
        <td class="table-cell">{{this.path}}</td>
        <td class="table-cell status">{{this.status}}</td>
      </tr>
    {{/each}}
    `
  this.tableRowTemplate = Handlebars.compile(tableRowMarkup);
 }

 render() {
   this.shadowRoot.appendChild(this.root.content.cloneNode(true));
   this.shadowRoot.querySelector('.table-content').innerHTML += this.tableRowTemplate({list: this.tableData});
 }

 handleClick(evt) {
   const targetEl = evt.path[0];

   if (targetEl.classList.contains(this.cssClasses.SELECT_ALL_CHECKBOX)) {
     this.toggleSelectAll(targetEl.checked);
     return;
   }  

   if (targetEl.classList.contains(this.cssClasses.TABLE_ROW_CHECKBOX)) {
    // Update background color of the table row
    targetEl.closest(`.${this.cssClasses.TABLE_ROW}`).classList.toggle(this.cssClasses.TABLE_ROW_SELECTED, targetEl.checked);
    this.updateSelectionCount();
    return;
   }

   if (targetEl.classList.contains(this.cssClasses.DOWNLOAD)) {
    this.showAlertBox();
    return;
   }
 }

 showAlertBox() {
  const selectedItems = this.getSelectedItems();
  let alertMessage = 'Select a valid file to download';
  if (selectedItems.length) {
    alertMessage = 'Downloading the following:\n' + selectedItems;
  }
  alert(alertMessage);
 }

 getSelectedItems() {
   const selectedItems = [];
   this.shadowRoot.querySelectorAll(`.${this.cssClasses.TABLE_ROW_CHECKBOX}`).forEach((checkbox, index) => {
     // look up the input data-set for this index. Only allow download if checkbox is checked and status is available.
     const tableEntry = this.tableData[index];
     if (checkbox.checked && tableEntry.status === 'available') {
       selectedItems.push(tableEntry.path + '--' + tableEntry.device);
     }
   });
   return selectedItems;
 }

 /**
  * @param {boolean} checked True if the checkboxes must be checked, false otherwise.
  */
 toggleSelectAll(checked) {
    const allTableRows = this.shadowRoot.querySelectorAll(`.${this.cssClasses.TABLE_ROW}`);
    
    allTableRows.forEach((row) => {
      // Set the checkbox state in this row.
      row.querySelector(`.${this.cssClasses.TABLE_ROW_CHECKBOX}`).checked = checked;
      // Update the background of the row depending on the checked state.
      row.classList.toggle(this.cssClasses.TABLE_ROW_SELECTED, checked);
    });

    // Update the count of items selected
    this.updateSelectionCount();
 }

 updateSelectionCount() { 
   const numSelectedRows = [...this.shadowRoot.querySelectorAll(`.${this.cssClasses.TABLE_ROW_CHECKBOX}`)].filter((e) => e.checked).length;
   const selectionStateWithCountEl = this.shadowRoot.querySelector('.selection-count .some');
   const selectionStateNoneEl = this.shadowRoot.querySelector('.selection-count .none');
   const selectAllCheckboxEl = this.shadowRoot.querySelector(`.${this.cssClasses.SELECT_ALL_CHECKBOX}`);

   // Update the state of the select-all checkbox.
   selectAllCheckboxEl.checked = numSelectedRows === this.tableData.length;
   selectAllCheckboxEl.indeterminate = numSelectedRows > 0 && numSelectedRows !== this.tableData.length;
   
   selectionStateWithCountEl.classList.toggle(this.cssClasses.HIDDEN, numSelectedRows === 0);
   selectionStateNoneEl.classList.toggle(this.cssClasses.HIDDEN, numSelectedRows > 0);
   if (numSelectedRows) {
       selectionStateWithCountEl.innerText = `${numSelectedRows} selected`;
   }
 }

 connectedCallback(){
    this.addEventListener('click', this.handleClick, false);
 }
}
window.customElements.define('tabular-data', TabularData);