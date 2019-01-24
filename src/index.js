
import assert from 'assert';
import fetch from 'node-fetch';

class Books extends Array {
  top10() {
    const books = Array.from(this);
    books.sort(({ volumeInfo: { averageRating: a } }, { volumeInfo: { averageRating: b } }) => {
      a = Number(a) || 0;
      b = Number(b) || 0;

      if (a > b) {
        return -1;
      }

      if (a < b) {
        return 1;
      }

      return 0;
    });
    return books.slice(0, 10).map(({ volumeInfo: { title, averageRating } }) => ({ title, averageRating: `${averageRating}` }));
  }

  cheapest5() {
    const costPerPage = ({ saleInfo: { listPrice: { amount } = {} } = {}, volumeInfo: { pageCount } = {} }) => {
      if (typeof amount === 'undefined' || typeof pageCount === 'undefined') {
        return;
      }

      return amount / pageCount;
    };

    const books = Array.from(this).filter(book => costPerPage(book) >= 0);
    books.sort((a, b) => {
      a = costPerPage(a);
      b = costPerPage(b);

      if (a > b) {
        return 1;
      }

      if (a < b) {
        return -1;
      }

      return 0;
    });
    return books.slice(0, 5).map((book) => ({ title: book.volumeInfo.title, costPerPage: `${costPerPage(book)}` }));
  }

  byPublisher() {
    const publishers = {};
    for (const book of this) {
      if (!(book.volumeInfo.publisher in publishers)) {
        publishers[book.volumeInfo.publisher] = [];
      }

      publishers[book.volumeInfo.publisher].push({
        title: book.volumeInfo.title,
        publishedDate: book.volumeInfo.publishedDate
      })
    }
    return publishers;
  }
}

const fetchBooks = async (query = 'programming') => {
  const books = new Books();
  for (let i = 0; i < 50; i += 10) {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${encodeURIComponent(i.toString())}`);
    const json = await response.json();
    assert(json.items.length === 10);
    books.push(...json.items);
  }
  return books;
}


(async () => {
  const books = await fetchBooks();
  assert(books.length === 50);

  process.stdout.write('\n\nTop 10 Rated Books:\n\n');
  process.stdout.write(JSON.stringify(books.top10(), null, 4));

  process.stdout.write('\n\nTop 5 Cheapest Books:\n\n');
  process.stdout.write(JSON.stringify(books.cheapest5(), null, 4));

  process.stdout.write('\n\nBooks by Publisher:\n\n');
  process.stdout.write(JSON.stringify(books.byPublisher(), null, 4));

  process.stdout.write('\n\n');
})();
