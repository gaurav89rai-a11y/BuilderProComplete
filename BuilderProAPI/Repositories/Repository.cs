using Microsoft.EntityFrameworkCore;
using BuilderProAPI.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace BuilderProAPI.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly BuilderProDbContext _db;
    internal DbSet<T> dbSet;

    public Repository(BuilderProDbContext db)
    {
        _db = db;
        this.dbSet = _db.Set<T>();
    }

    public async Task<IEnumerable<T>> GetAllAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        string includeProperties = ""
    )
    {
        IQueryable<T> query = dbSet;

        if (filter != null)
        {
            query = query.Where(filter);
        }

        foreach (var includeProp in includeProperties.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
        {
            query = query.Include(includeProp.Trim());
        }

        if (orderBy != null)
        {
            return await orderBy(query).ToListAsync();
        }
        return await query.ToListAsync();
    }

    public async Task<T?> GetFirstOrDefaultAsync(
        Expression<Func<T, bool>> filter,
        string includeProperties = ""
    )
    {
        IQueryable<T> query = dbSet;
        query = query.Where(filter);

        foreach (var includeProp in includeProperties.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
        {
            query = query.Include(includeProp.Trim());
        }

        return await query.FirstOrDefaultAsync();
    }

    public async Task<T?> GetByIdAsync(object id)
    {
        return await dbSet.FindAsync(id);
    }

    public async Task AddAsync(T entity)
    {
        await dbSet.AddAsync(entity);
    }

    public void Remove(T entity)
    {
        dbSet.Remove(entity);
    }

    public void Update(T entity)
    {
        dbSet.Update(entity);
    }
}
