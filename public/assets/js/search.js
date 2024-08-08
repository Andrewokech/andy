document.getElementById('searchBar').addEventListener('input', (e) => {
    const searchData = e.target.value.trim().toLowerCase();
    const elementsToSearch = document.querySelectorAll('.searchable');

    elementsToSearch.forEach((element) => {
        const text = element.textContent.toLowerCase();
        let index = text.indexOf(searchData);

        while (index !== -1) {
            const matchedElement = element;
            if (matchedElement) {
                matchedElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            index = text.indexOf(searchData, index + 1);
        }
    });
});
