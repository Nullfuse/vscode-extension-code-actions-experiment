int main()
{
    int *y = malloc(sizeof(int)*10);
    y[5] = 20;
    int x = y[5];
    x = threadIdx.x;
    ++x;
    x = x + 2;
    x = x + 3;
    if(x == 1) {
        x = 1;
    }
    if(x == x) {
        x = 2;
    }
    if(x != x) {
        x = 3;
    }
    if(x = 1) {
        // Do Something
    }
    x = (x == x) ? 7 : 8;
    x = (x == (x+1)) ? 9 : 10;
    x = (x == randomVariable) ? 11 : 12;
    while(x < 4) {
        x = 4;
    }
    for(int i = threadIdx.x; i < 5; ++i) {
        // Do Something
    }
    switch(x) {
        case 5:
            // Do Something
            break;
        case threadIdx.x:
            // Do Something
            break;
        default:
            // Do Something
    }
    int sizeA = 10;
    int *h_A = 0;
    int *d_A = 0;
    h_A = malloc(sizeof(double)*sizeA);
    cudaMalloc( (void**)&d_A , sizeA );
    d_A = cudaMalloc(sizeA);
    return 0;
}
