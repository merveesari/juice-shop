module.exports = function searchProducts() {
  return (req, res, next) => {
    const criteria = req.query.q || '';
    const sanitizedCriteria = criteria.substring(0, 200);

    // SQL Injection'i önlemek için parametrelerle çalışan bir sorgu kullan
    const query = {
      where: {
        deletedAt: null,
        [Op.or]: [
          {
            name: {
              [Op.like]: `%${sanitizedCriteria}%`
            }
          },
          {
            description: {
              [Op.like]: `%${sanitizedCriteria}%`
            }
          }
        ]
      },
      order: ['name']
    };

    ProductModel.findAll(query)
      .then((products) => {
        const sanitizedProducts = products.map((product) => {
          return {
            name: req.__(product.name),
            description: req.__(product.description)
          };
        });
        res.json(sanitizedProducts);
      })
      .catch((error) => {
        next(error);
      });
  }
}
