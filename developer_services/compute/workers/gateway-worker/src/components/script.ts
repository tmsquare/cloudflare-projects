import { html } from 'hono/html';

export const Scripts = () => html`
<script>
    function toggleSubRows(className) {
        const rows = document.getElementsByClassName(className);
        for (const row of rows) {
        row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
        }
    }
</script> 
`;