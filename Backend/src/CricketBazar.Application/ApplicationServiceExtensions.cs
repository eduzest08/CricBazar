namespace CricketBazar.Application;

using MediatR;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using AutoMapper;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register MediatR
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

        // Register AutoMapper
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddMaps(Assembly.GetExecutingAssembly());
        });
        services.AddSingleton(config.CreateMapper());

        // Register FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        return services;
    }
}
