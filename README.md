# Restaurant Automation and Order Management System

## Project Overview

The Restaurant Automation and Order Management System is a web-based application designed to automate major restaurant operations such as menu management, customer ordering, kitchen order processing, billing, inventory management, and administrative reporting.

The system uses a distributed application architecture in which the frontend, backend, and database operate as separate components and communicate through APIs.

## Problem Statement

Traditional restaurant operations may involve manual handling of customer orders, communication between the kitchen and cashier, billing, and inventory management. These processes can result in delays, incorrect order handling, difficulty tracking order status, and inefficient inventory management.

This project aims to develop an integrated restaurant automation system that connects these operations through a centralized web application.

## Objectives

- Develop a web-based restaurant automation system.
- Automate customer ordering and order management.
- Provide a dedicated kitchen dashboard for processing orders.
- Automate billing and payment recording.
- Automate inventory updates based on completed orders.
- Provide role-based access for different users.
- Deploy the application using cloud services.
- Demonstrate communication between distributed application components.
- Evaluate application performance under different workloads.

## Users

The system supports the following users:

- Customer
- Kitchen Staff
- Cashier
- Administrator

## Main Features

### Customer

- Registration and login
- Browse restaurant menu
- Search and filter menu items
- Add items to cart
- Place orders
- Track order status
- View order history
- View bills

### Kitchen Staff

- View incoming orders
- Accept orders
- Start order preparation
- Mark orders as ready
- Complete orders

### Cashier

- View customer orders
- View bills
- Record payments
- Complete orders

### Administrator

- Manage menu items
- Manage food categories
- Manage inventory
- Manage users
- View orders
- View sales information
- Monitor low-stock items
- View reports

## Order Workflow

The order lifecycle is:

PLACED → CONFIRMED → PREPARING → READY → COMPLETED

## System Architecture

The system follows a distributed three-tier architecture consisting of:

1. Presentation Layer - React frontend
2. Application Layer - Node.js and Express backend
3. Data Layer - PostgreSQL database

A background processing component may be added for asynchronous tasks.

```text
Customer / Staff
       |
       v
React Frontend
       |
       | REST API / HTTPS
       v
Node.js + Express Backend
       |
       +----------------+
       |                |
       v                v
PostgreSQL       Background Worker
Database