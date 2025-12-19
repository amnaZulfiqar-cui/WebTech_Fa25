// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle for admin
    const adminMenuToggle = document.querySelector('.mobile-menu-toggle');
    const adminSidebar = document.querySelector('.sidebar');

    if (adminMenuToggle && adminSidebar) {
        adminMenuToggle.addEventListener('click', function () {
            adminSidebar.classList.toggle('open');
        });
    }

    // Image preview for product forms
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                }

                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Confirm delete action
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            if (!confirm('Are you sure you want to delete