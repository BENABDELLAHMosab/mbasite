(() => {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;

    buttons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.classList.contains('active')));
        button.addEventListener('click', () => {
            buttons.forEach(btn => {
                const selected = btn === button;
                btn.classList.toggle('btn-primary', selected);
                btn.classList.toggle('active', selected);
                btn.classList.toggle('btn-outline', !selected);
                btn.setAttribute('aria-pressed', String(selected));
            });

            const filter = button.dataset.filter;
            let visibleCount = 0;
            cards.forEach(card => {
                const visible = filter === 'all' || card.dataset.category.split(/\s+/).includes(filter);
                card.style.display = visible ? 'flex' : 'none';
                if (visible) visibleCount++;
            });
            grid.classList.toggle('grid-center-1', visibleCount === 1);
            grid.classList.toggle('grid-center-2', visibleCount === 2);
        });
    });
})();
