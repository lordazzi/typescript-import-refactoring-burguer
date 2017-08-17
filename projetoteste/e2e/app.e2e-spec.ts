import { ProjetotestePage } from './app.po';

describe('projetoteste App', function() {
  let page: ProjetotestePage;

  beforeEach(() => {
    page = new ProjetotestePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
